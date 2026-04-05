import psycopg2

def get_connection():
    return psycopg2.connect(
        host="localhost",
        database="TestDatabase",
        user="postgres",
        password="cr146569",
        port="5432"
    )