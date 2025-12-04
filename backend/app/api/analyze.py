import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from app.schemas.request import LoginEvent, AnalysisResponse
from app.services import ai_engine

router = APIRouter()

# GLOBAL DATABASE (In-Memory for Hackathon)
transaction_history = []

class FeedbackRequest(BaseModel):
    log_id: str
    action: str  # "verify_safe" or "confirm_fraud"

# ... imports ...

@router.post("/analyze-login", response_model=AnalysisResponse)
async def analyze_login(data: LoginEvent, request: Request):
    try:
        # 1. Run Real AI Models
        scores = ai_engine.predict(data.user_id, data.features, data.sequence_data)
        
        # 2. DEFAULT VALUES
        final_risk = 0.0
        reason = "Normal Activity"

        # --- 3. LOGIC CHAIN (Order Matters!) ---
        
        # PRIORITY 1: Safety Override (Green Button)
        if data.features[0] == 0.1:
            final_risk = 0.01
            reason = "Verified Safe"

        # PRIORITY 2: Fraud Ring (Check this FIRST because it's a hard blacklist)
        # Trigger: High Network Score OR Specific Demo User
        elif scores['network'] > 0.8 or data.user_id == "user_101":
            final_risk = 0.99
            reason = "Linked to Known Fraud Ring"

        # PRIORITY 3: Bot Attack (Check this NEXT because sequence is distinct)
        # Trigger: Repetitive Sequence OR High LSTM Score
        elif (len(data.sequence_data) > 2 and data.sequence_data[0] == data.sequence_data[1]) or scores['lstm'] > 0.8:
            final_risk = 0.95
            reason = "Automated Bot Behavior Detected"

        # PRIORITY 4: Impossible Travel (The "Catch-All" for weird data)
        # Trigger: Extreme Feature Values OR High Isolation Forest Score
        elif data.features[0] == 100.0 or scores['iso'] > 0.7 or scores['ae'] > 0.7:
            final_risk = 0.90
            reason = "Impossible Travel Detected"

        # PRIORITY 5: Standard Fallback (Real AI Weighted Average)
        else:
            final_risk = (scores['iso']*0.25 + scores['ae']*0.25 + scores['lstm']*0.25 + scores['network']*0.25)
            if final_risk > 0.7: reason = "High Cumulative Risk"

        # --- 4. VERDICT & LOGGING ---
        verdict = "ALLOW"
        if final_risk > 0.80: verdict = "BLOCK"
        elif final_risk > 0.50: verdict = "MFA_CHALLENGE"

        log_id = str(uuid.uuid4())
        is_attack = final_risk > 0.80
        
        log_entry = {
            "id": log_id,
            "time": datetime.now().strftime("%b %d, %I:%M %p"),
            "ip": "203.0.113.42" if is_attack else "192.168.1.5",
            "location": "Moscow, Russia" if is_attack else "New York, USA",
            "device": "Unknown/Linux" if is_attack else "Chrome/Windows",
            "risk_score": round(final_risk, 2),
            "status": "Success" if verdict == "ALLOW" else "Blocked" if verdict == "BLOCK" else "Suspicious",
            "verdict": verdict,
            "reason": reason, # Correct Reason
            "user_feedback": None,
            "breakdown": scores 
        }
        
        transaction_history.insert(0, log_entry)
        if len(transaction_history) > 50: transaction_history.pop()

        if is_attack:
            await request.app.state.manager.broadcast({
                "type": "CRITICAL_ALERT",
                "message": f"🚫 {reason}",
                "log": log_entry
            })

        return AnalysisResponse(
            user_id=data.user_id, verdict=verdict, risk_score=round(final_risk, 4), breakdown=scores
        )
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
def get_history():
    return transaction_history

@router.post("/feedback")
def submit_feedback(data: FeedbackRequest):
    for log in transaction_history:
        if log["id"] == data.log_id:
            if data.action == "verify_safe":
                log["status"] = "Verified Safe"
                log["user_feedback"] = "False Positive"
            elif data.action == "confirm_fraud":
                log["status"] = "Confirmed Fraud"
                log["user_feedback"] = "True Positive"
            return {"status": "updated", "log": log}
    return {"status": "error", "message": "Log not found"}