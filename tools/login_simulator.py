import requests
import random
import argparse
import time

API_URL = input("Enter backend URL : ")


USERS = [
    "alice", "bob", "charlie", "diana",
    "eve", "frank", "george", "harry"
]

# -------------------------
# SEND EVENT
# -------------------------
def send_event(user_id, features, sequence_data):
    payload = {
        "user_id": user_id,
        "features": features,
        "sequence_data": sequence_data
    }

    print(f"[SEND] {payload}")

    try:
        r = requests.post(API_URL, json=payload, timeout=8)
        print(f"[RESPONSE] {r.status_code} {r.text}")
        return r
    except Exception as e:
        print(f"[ERROR] {e}")
        return None

# -------------------------
# NORMAL
# -------------------------
def simulate_normal(count):
    for _ in range(count):
        user = random.choice(USERS)
        features = [round(random.uniform(0.1, 0.3), 3) for _ in range(4)]
        sequence = [[i % 4 + 1] for i in range(10)]  # stable pattern
        send_event(user, features, sequence)
        time.sleep(0.4)

# -------------------------
# IMPOSSIBLE TRAVEL
# -------------------------
def simulate_impossible_travel():
    user = random.choice(USERS)

    features_1 = [0.2, 0.2, 0.2, 0.2]
    seq_1 = [[1],[2],[3],[4],[1],[2]]

    features_2 = [100.0, 0.1, 0.1, 0.1]  # triggers impossible travel
    seq_2 = [[1],[4],[1],[4],[1],[4]]

    send_event(user, features_1, seq_1)
    send_event(user, features_2, seq_2)

# -------------------------
# BOT SCRIPT
# -------------------------
def simulate_bot_script(user=None, attempts=50):
    if not user:
        user = random.choice(USERS)

    features = [0.2, 0.2, 0.2, 0.2]  # repetitive
    sequence = [[1] for _ in range(10)]  # bot-like uniform

    for _ in range(attempts):
        send_event(user, features, sequence)
        time.sleep(0.1)

# -------------------------
# FRAUD RING
# -------------------------
def simulate_fraud_ring(group_size=5):
    features_shared = [0.9, 0.9, 0.9, 0.9]  # triggers fraud ring
    users = random.sample(USERS, group_size)

    for u in users:
        seq = [[random.randint(1, 4)] for _ in range(10)]
        send_event(u, features_shared, seq)
        time.sleep(0.25)

# -------------------------
# CLI
# -------------------------
def main():
    parser = argparse.ArgumentParser(description="AI Login Simulator")

    parser.add_argument("--mode", required=True, choices=[
        "normal", "impossible_travel", "bot_script", "fraud_ring"
    ])

    parser.add_argument("--count", type=int, default=10)
    parser.add_argument("--attempts", type=int, default=50)
    parser.add_argument("--user", type=str)
    parser.add_argument("--group-size", type=int, default=5)

    a = parser.parse_args()

    if a.mode == "normal":
        simulate_normal(a.count)
    elif a.mode == "impossible_travel":
        simulate_impossible_travel()
    elif a.mode == "bot_script":
        simulate_bot_script(a.user, a.attempts)
    elif a.mode == "fraud_ring":
        simulate_fraud_ring(a.group_size)

if __name__ == "__main__":
    main()
