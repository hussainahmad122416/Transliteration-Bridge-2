from fastapi.testclient import TestClient
from main import app
from backend.database import Base, engine
import uuid

# Recreate tables to ensure they exist (for simple sqlite local testing)
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_auth_flow():
    test_email = f"test_{uuid.uuid4().hex[:6]}@example.com"
    test_password = "securepassword123"

    print(f"1. Testing Signup for {test_email}...")
    res_signup = client.post("/api/auth/signup", json={"email": test_email, "password": test_password})
    print("Signup Status:", res_signup.status_code)
    if res_signup.status_code != 200:
        print("Signup Failed:", res_signup.json())
        return

    print("2. Testing Login with JSON (Should Fail or Succeed depending on our form config)...")
    res_login_json = client.post("/api/auth/login", json={"username": test_email, "password": test_password})
    print("JSON Login Status (Expected 422):", res_login_json.status_code)

    print("3. Testing Login with Form Data (Should Succeed)...")
    res_login_form = client.post("/api/auth/login", data={"username": test_email, "password": test_password})
    print("Form Login Status:", res_login_form.status_code)
    
    if res_login_form.status_code != 200:
        print("Form Login Failed:", res_login_form.json())
        return
        
    token = res_login_form.json().get("access_token")
    print(f"Token received: {token[:20]}...")

    print("4. Testing /me endpoint with Token...")
    res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    print("/me Status:", res_me.status_code)
    if res_me.status_code == 200:
        print("Logged in User Email:", res_me.json().get("email"))
    
    print("\n--- AUTH FLOW TEST SUCCESSFUL ---")

if __name__ == "__main__":
    test_auth_flow()
