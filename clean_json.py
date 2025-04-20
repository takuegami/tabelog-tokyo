import json
import os

# JSONファイルのパス
file_path = os.path.join('src', 'data', 'shops.json')

try:
    # ファイルを読み込む (エンコーディングをutf-8-sigに指定してBOMを処理)
    with open(file_path, 'r', encoding='utf-8-sig') as f:
        data = json.load(f)

    # JSONデータを整形して書き込む (ensure_ascii=Falseで日本語をそのまま出力)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Successfully cleaned and reformatted {file_path}")

except json.JSONDecodeError as e:
    print(f"Error decoding JSON: {e}")
except Exception as e:
    print(f"An error occurred: {e}")