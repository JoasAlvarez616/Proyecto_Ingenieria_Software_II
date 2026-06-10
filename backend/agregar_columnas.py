import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "database", "hotel.db")

print("🔧 Agregando columnas faltantes a la tabla clients...")
print("-" * 50)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Agregar columna es_extranjero
try:
    cursor.execute("ALTER TABLE clients ADD COLUMN es_extranjero BOOLEAN DEFAULT 0")
    print("✅ Columna 'es_extranjero' agregada")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e):
        print("⚠️ La columna 'es_extranjero' ya existe")
    else:
        print(f"❌ Error: {e}")

# Agregar columna pais
try:
    cursor.execute("ALTER TABLE clients ADD COLUMN pais VARCHAR(50) DEFAULT 'Colombia'")
    print("✅ Columna 'pais' agregada")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e):
        print("⚠️ La columna 'pais' ya existe")
    else:
        print(f"❌ Error: {e}")

conn.commit()
conn.close()

print("-" * 50)
print("✅ Migración completada")