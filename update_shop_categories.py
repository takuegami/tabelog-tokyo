import json
import sys
import os

# マッピング辞書: キーワード -> ターゲットカテゴリ (グローバルスコープ)
area_category_map = {
    # 京王・小田急沿線 -> ターゲットカテゴリ
    '新宿': '新宿・代々木',
    '渋谷': '渋谷・恵比寿・代官山',
    '代官山': '渋谷・恵比寿・代官山',
    '恵比寿': '渋谷・恵比寿・代官山',
    '中目黒': '渋谷・恵比寿・代官山',
    '下北沢': '下北沢・明大前・成城学園前',
    '明大前': '下北沢・明大前・成城学園前',
    '成城学園': '下北沢・明大前・成城学園前',
    # 西武沿線 -> ターゲットカテゴリ
    '池袋': '池袋・巣鴨・駒込',
    '巣鴨': '池袋・巣鴨・駒込',
    '駒込': '池袋・巣鴨・駒込',
    '高田馬場': '高田馬場・早稲田・大久保',
    '早稲田': '高田馬場・早稲田・大久保',
    '大久保': '高田馬場・早稲田・大久保',
    # 板橋・東武沿線 -> ターゲットカテゴリ
    '赤羽': '赤羽・王子・十条',
    '王子': '赤羽・王子・十条',
    '十条': '赤羽・王子・十条',
}

def get_new_category(area, current_category, existing_categories):
    if current_category not in ['京王・小田急沿線', '西武沿線', '板橋・東武沿線']:
        return current_category # 対象外カテゴリはそのまま返す

    # area が None の場合は空文字列として扱う
    area_str = area if area else ""

    new_category = 'その他' # デフォルト

    # 1. area 文字列全体がマップのキーに完全一致するか確認
    if area_str in area_category_map:
        potential_category = area_category_map[area_str]
        if potential_category in existing_categories:
            return potential_category # 既存カテゴリにあれば採用

    # 2. area 文字列にキーワードが含まれるか確認 (部分一致)
    #    より具体的なキーワードからチェックするために、キーの文字数で降順ソート
    sorted_keywords = sorted(area_category_map.keys(), key=len, reverse=True)
    for keyword in sorted_keywords:
        if keyword in area_str:
            target_category = area_category_map[keyword]
            if target_category in existing_categories:
                new_category = target_category
                break # 最初に見つかった有効なカテゴリを採用

    return new_category

# --- メイン処理 ---
file_path = 'src/data/shops.json'
backup_path = file_path + '.bak' # バックアップファイルパス

try:
    # バックアップを作成
    if os.path.exists(file_path):
         with open(file_path, 'r', encoding='utf-8') as f_read, open(backup_path, 'w', encoding='utf-8') as f_write:
              f_write.write(f_read.read())
         print(f"Backup created at {backup_path}")
    else:
         print(f"Warning: Original file {file_path} not found. Cannot create backup.", file=sys.stderr)


    with open(file_path, 'r', encoding='utf-8') as f:
        shops = json.load(f)

    # 既存のカテゴリリストを取得 (Noneや空文字を除外し、廃止対象も除く)
    original_categories = set(shop.get('area_category') for shop in shops if shop.get('area_category'))
    valid_existing_categories = {
        cat for cat in original_categories
        if cat not in ['京王・小田急沿線', '西武沿線', '板橋・東武沿線']
    }
    # 振り分け先のカテゴリが存在しない可能性も考慮し、マップのターゲットカテゴリは無条件で有効とみなす
    # (ただし、最終的に 'その他' になる可能性はある)
    target_categories_from_map = set(area_category_map.values())
    valid_categories_for_check = valid_existing_categories.union(target_categories_from_map)
    valid_categories_for_check.add('その他') # その他は常に有効


    updated_shops = []
    update_count = 0
    for shop in shops:
        updated_shop = shop.copy()
        current_category = updated_shop.get('area_category')
        area = updated_shop.get('area')

        # current_category が廃止対象の場合のみ振り分け処理を実行
        if current_category in ['京王・小田急沿線', '西武沿線', '板橋・東武沿線']:
            new_cat = get_new_category(area, current_category, valid_categories_for_check)
            if new_cat != current_category:
                 updated_shop['area_category'] = new_cat
                 update_count += 1
        # 廃止対象でないカテゴリはそのまま維持
        updated_shops.append(updated_shop)


    # 更新があった場合のみファイルを書き換える
    if update_count > 0:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(updated_shops, f, ensure_ascii=False, indent=2)
            # JSON配列の末尾に改行を追加
            f.write('\n')
        print(f"Successfully updated {update_count} entries in {file_path}")
    else:
        print(f"No entries needed updating in {file_path}")
        # 更新がなかった場合はバックアップファイルを削除
        if os.path.exists(backup_path):
            os.remove(backup_path)
            print(f"Removed backup file: {backup_path}")


except FileNotFoundError:
    print(f"Error: File not found at {file_path}", file=sys.stderr)
    # バックアップファイルが作られていたら削除
    if os.path.exists(backup_path):
        try:
            os.remove(backup_path)
            print(f"Removed backup file due to error: {backup_path}")
        except OSError as e:
            print(f"Error removing backup file {backup_path}: {e}", file=sys.stderr)
    sys.exit(1)
except json.JSONDecodeError:
    print(f"Error: Could not decode JSON from {file_path}", file=sys.stderr)
    # バックアップファイルが作られていたら削除
    if os.path.exists(backup_path):
        try:
            os.remove(backup_path)
            print(f"Removed backup file due to error: {backup_path}")
        except OSError as e:
            print(f"Error removing backup file {backup_path}: {e}", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f"An unexpected error occurred: {e}", file=sys.stderr)
    # バックアップファイルが作られていたら削除
    if os.path.exists(backup_path):
        try:
            os.remove(backup_path)
            print(f"Removed backup file due to error: {backup_path}")
        except OSError as e:
            print(f"Error removing backup file {backup_path}: {e}", file=sys.stderr)
    sys.exit(1)