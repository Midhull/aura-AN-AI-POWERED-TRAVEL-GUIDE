import pg8000

credentials = [
    {"user": "postgres", "password": ""},
    {"user": "postgres", "password": "postgres"},
    {"user": "postgres", "password": "password"},
    {"user": "postgres", "password": "admin"},
]

success = False
for cred in credentials:
    try:
        conn = pg8000.connect(
            host="127.0.0.1",
            port=5432,
            user=cred["user"],
            password=cred["password"],
            database="postgres"
        )
        print(f"Success! Connected to local Postgres with user={cred['user']} and password='{cred['password']}'")
        
        # List databases
        cursor = conn.cursor()
        cursor.execute("SELECT datname FROM pg_database WHERE datistemplate = false;")
        dbs = cursor.fetchall()
        print("Available databases:", [db[0] for db in dbs])
        
        cursor.close()
        conn.close()
        success = True
        break
    except Exception as e:
        print(f"Failed with user={cred['user']} password='{cred['password']}': {e}")

if not success:
    print("Could not connect to local Postgres with default credentials.")
