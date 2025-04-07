use axum::{
    extract::State,
    http::Method,
    response::{Json, IntoResponse},
    routing::{get, post},
    Router,
};
use axum::extract::ws::{WebSocketUpgrade, WebSocket, Message};
use futures_util::{SinkExt, StreamExt};
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::{Mutex, broadcast};
use tower_http::cors::{Any, CorsLayer};
use chrono::Utc; // For computing transaction age
use serde_json::Value;
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MempoolTransaction {
    txid: String,
    fee_rate: f64, // sat/vB
    size: u32,
    inputs: u8,
    outputs: u8,
    age: u32, // in minutes
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobDeclarationRequest {
    coinbase: String,
    txids: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobDeclarationResponse {
    job_id: String,
    header_template: String,
}

#[derive(Clone)]
struct AppState {
    selected_txs: Arc<Mutex<Vec<String>>>,
    tx_sender: broadcast::Sender<Vec<MempoolTransaction>>,
}

/// Fetch realistic mempool data from mempool.space (Testnet version).
/// Uses a 10-second timeout for each external call.
async fn fetch_real_mempool() -> Vec<MempoolTransaction> {
    // Build a client with a 10-second timeout.
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .unwrap();
    // Testnet endpoint
    let txids_url = "https://mempool.space/testnet/api/mempool/txids";
    
    // Get array of TXIDs
    let txids_response = client.get(txids_url).send().await;
    if let Ok(resp) = txids_response {
        if let Ok(txids) = resp.json::<Vec<String>>().await {
            // Limit to first 25 TXIDs for performance.
            let txids = txids.into_iter().take(25).collect::<Vec<_>>();
            let mut transactions = Vec::new();
            let now = Utc::now().timestamp();
            for txid in txids {
                // Update detail endpoint for testnet
                let detail_url = format!("https://mempool.space/testnet/api/tx/{}", txid);
                if let Ok(detail_resp) = client.get(&detail_url).send().await {
                    if let Ok(detail_json) = detail_resp.json::<Value>().await {
                        // Extract fee, size (or vsize), inputs, outputs and tx time.
                        let fee = detail_json["fee"].as_f64().unwrap_or(0.0);
                        // Use vsize if available; otherwise fallback to size.
                        let vsize = detail_json["vsize"]
                            .as_u64()
                            .or(detail_json["size"].as_u64())
                            .unwrap_or(0);
                        let fee_rate = if vsize > 0 {
                            fee / vsize as f64
                        } else {
                            0.0
                        };
                        let size = detail_json["size"].as_u64().unwrap_or(0) as u32;
                        let inputs = detail_json["vin"]
                            .as_array()
                            .map(|arr| arr.len() as u8)
                            .unwrap_or(0);
                        let outputs = detail_json["vout"]
                            .as_array()
                            .map(|arr| arr.len() as u8)
                            .unwrap_or(0);
                        // Use the transaction's "time" field (if available) to calculate age.
                        let tx_time = detail_json["time"].as_i64().unwrap_or(now);
                        let age = ((now - tx_time) / 60) as u32;
                        
                        transactions.push(MempoolTransaction {
                            txid: txid.clone(),
                            fee_rate,
                            size,
                            inputs,
                            outputs,
                            age,
                        });
                    }
                }
            }
            return transactions;
        }
    }
    // Fallback: return an empty vector if API call fails.
    Vec::new()
}

// GET /transactions endpoint using realistic mempool data.
async fn get_transactions() -> Json<Vec<MempoolTransaction>> {
    Json(fetch_real_mempool().await)
}

// Update the selected transactions.
async fn update_selection(
    State(state): State<AppState>,
    Json(selected): Json<Vec<String>>,
) -> Json<Vec<String>> {
    let mut selected_txs = state.selected_txs.lock().await;
    *selected_txs = selected;
    Json(selected_txs.clone())
}

// GET /selected returns the current selection.
async fn get_selected(State(state): State<AppState>) -> Json<Vec<String>> {
    let selected_txs = state.selected_txs.lock().await;
    Json(selected_txs.clone())
}

// Job declaration handler.
async fn job_declare(Json(req): Json<JobDeclarationRequest>) -> Json<JobDeclarationResponse> {
    let mut rng = rand::thread_rng();
    let job_id = format!("{:0>8x}", rng.gen::<u32>());
    let header_template = format!("Header template for coinbase: {}", req.coinbase);
    Json(JobDeclarationResponse { job_id, header_template })
}

// WebSocket handler to push real‑time mempool updates.
async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

// Handle the WebSocket connection by subscribing to mempool updates.
async fn handle_socket(mut socket: WebSocket, state: AppState) {
    let mut rx = state.tx_sender.subscribe();
    while let Ok(mempool) = rx.recv().await {
        if let Ok(msg) = serde_json::to_string(&mempool) {
            if socket.send(Message::Text(msg)).await.is_err() {
                // Client disconnected.
                break;
            }
        }
    }
}

// Background task that periodically fetches realistic mempool data and broadcasts it.
async fn broadcast_mempool_updates(state: AppState) {
    loop {
        let mempool = fetch_real_mempool().await;
        let _ = state.tx_sender.send(mempool);
        tokio::time::sleep(Duration::from_secs(15)).await;
    }
}

#[tokio::main]
async fn main() {
    // Create shared application state.
    let (tx_sender, _) = broadcast::channel(16);
    let state = AppState {
        selected_txs: Arc::new(Mutex::new(Vec::new())),
        tx_sender,
    };

    // Spawn the background task for broadcasting mempool updates.
    let state_clone = state.clone();
    tokio::spawn(async move {
        broadcast_mempool_updates(state_clone).await;
    });

    // Configure CORS.
    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST])
        .allow_origin(Any)
        .allow_headers(Any);

    // Build the router.
    let app = Router::new()
        .route("/transactions", get(get_transactions))
        .route("/selected", get(get_selected).post(update_selection))
        .route("/job_declare", post(job_declare))
        .route("/ws", get(ws_handler))
        .layer(cors)
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .unwrap();
    axum::serve(listener, app).await.unwrap();
}
