"""
MongoDB to Supabase Migration Script
=====================================
Migrates data from MongoDB JSON exports to Supabase PostgreSQL.

Usage:
1. Install dependencies: pip install supabase python-dateutil
2. Set your credentials below
3. Run: python migrate_mongodb_to_supabase.py
"""

import json
from datetime import datetime
from dateutil import parser as date_parser
from supabase import create_client, Client

# ============== CONFIGURATION ==============
# Get these from Lovable Cloud → Secrets
SUPABASE_URL = "https://qxrctijucnwbxkxgulan.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "YOUR_SERVICE_ROLE_KEY_HERE"  # Required to bypass RLS
USER_ID = "YOUR_USER_ID_HERE"  # The UUID of your authenticated user

# File paths (update if needed)
BUDGET_FILE = "networth.budget.json"
EXPENSES_FILE = "networth.expenses.json"
INCOMES_FILE = "networth.incomes.json"
SAVINGS_FILE = "networth.savings.json"
# ===========================================


def get_supabase_client() -> Client:
    """Create Supabase client with service role key to bypass RLS."""
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def parse_mongo_date(date_value) -> str | None:
    """Parse MongoDB date format to ISO string."""
    if date_value is None:
        return None
    if isinstance(date_value, dict) and "$date" in date_value:
        return date_value["$date"]
    if isinstance(date_value, str):
        try:
            return date_parser.parse(date_value).isoformat()
        except:
            return date_value
    return str(date_value)


def parse_date_only(date_value) -> str | None:
    """Parse MongoDB date to YYYY-MM-DD format for date columns."""
    if date_value is None:
        return None
    if isinstance(date_value, dict) and "$date" in date_value:
        date_str = date_value["$date"]
    elif isinstance(date_value, str):
        date_str = date_value
    else:
        return None
    
    try:
        parsed = date_parser.parse(date_str)
        return parsed.strftime("%Y-%m-%d")
    except:
        return None


def load_json_file(filepath: str) -> list:
    """Load and parse JSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


# ============== TRANSFORMERS ==============

def transform_budget(item: dict, user_id: str) -> dict:
    """Transform MongoDB budget to Supabase schema."""
    total_budget = item.get("totalBudget", 0)
    if isinstance(total_budget, str):
        total_budget = float(total_budget) if total_budget else 0
    
    spent_budget = item.get("spentBudget", 0)
    if isinstance(spent_budget, str):
        spent_budget = float(spent_budget) if spent_budget else 0
    
    return {
        "user_id": user_id,
        "month": item.get("month"),
        "total_budget": total_budget,
        "spent_budget": spent_budget,
        "left_budget": total_budget - spent_budget,
        "days_in_month": item.get("daysInMonth"),
        "daily_limit": item.get("dailyLimit", 0),
        "currency": item.get("currency", "ILS"),
        "status": item.get("status"),
        "notes": item.get("notes"),
    }


def transform_expense(item: dict, user_id: str) -> dict:
    """Transform MongoDB expense to Supabase schema."""
    # Parse recurring info
    recurring = item.get("recurring", {})
    recurring_type = recurring.get("type") if recurring else None
    recurring_day = recurring.get("dayOfMonth") if recurring else None
    
    return {
        "user_id": user_id,
        "month": item.get("month"),
        "expense_date": parse_date_only(item.get("expenseDate")),
        "amount": float(item.get("amount", 0)),
        "category": item.get("category", "other"),
        "kind": item.get("kind", "payed"),
        "payment_method": item.get("paymentMethod", "bank_transfer"),
        "card_id": item.get("cardId"),
        "description": item.get("description", ""),
        "expense_month": item.get("expenseMonth"),
        "month_of_expense": item.get("monthOfExpense"),
        "recurring_type": recurring_type,
        "recurring_day_of_month": recurring_day,
    }


def transform_income(item: dict, user_id: str) -> dict:
    """Transform MongoDB income to Supabase schema."""
    # Parse recurring info
    recurring = item.get("recurring", {})
    recurring_type = recurring.get("type") if recurring else None
    recurring_day = recurring.get("dayOfMonth") if recurring else None
    
    # Derive income_date from updateDate or month
    income_date = parse_date_only(item.get("incomeDate"))
    if not income_date:
        update_date = parse_date_only(item.get("updateDate"))
        if update_date:
            income_date = update_date
        elif item.get("month"):
            # Default to first of month
            income_date = f"{item.get('month')}-01"
    
    return {
        "user_id": user_id,
        "month": item.get("month"),
        "income_date": income_date,
        "amount": float(item.get("amount", 0)),
        "name": item.get("name", "Unknown"),
        "description": item.get("description"),
        "recurring_type": recurring_type,
        "recurring_day_of_month": recurring_day,
    }


def transform_savings(item: dict, user_id: str) -> dict:
    """Transform MongoDB savings to Supabase schema."""
    # Parse recurring info
    recurring = item.get("recurring", {})
    recurring_type = recurring.get("type") if recurring else None
    recurring_day = recurring.get("dayOfMonth") if recurring else None
    monthly_deposit = recurring.get("monthlyDeposit") if recurring else None
    
    return {
        "user_id": user_id,
        "month": item.get("month"),
        "name": item.get("name", "Unknown"),
        "amount": float(item.get("amount", 0)),
        "currency": item.get("currency", "ILS"),
        "transfer_method": item.get("transferMethod", "bank_account"),
        "card_id": item.get("cardId"),
        "action": item.get("action"),
        "action_amount": float(item.get("actionAmount", 0)) if item.get("actionAmount") else None,
        "recurring_type": recurring_type,
        "recurring_day_of_month": recurring_day,
        "monthly_deposit": monthly_deposit,
    }


# ============== MIGRATION FUNCTIONS ==============

def migrate_budgets(supabase: Client, user_id: str):
    """Migrate budgets collection."""
    print("\n📊 Migrating BUDGETS...")
    data = load_json_file(BUDGET_FILE)
    
    transformed = [transform_budget(item, user_id) for item in data]
    
    # Insert in batches of 100
    batch_size = 100
    total = len(transformed)
    
    for i in range(0, total, batch_size):
        batch = transformed[i:i + batch_size]
        result = supabase.table("budgets").insert(batch).execute()
        print(f"  ✓ Inserted {min(i + batch_size, total)}/{total} budgets")
    
    print(f"  ✅ Migrated {total} budgets")


def migrate_expenses(supabase: Client, user_id: str):
    """Migrate expenses collection."""
    print("\n💸 Migrating EXPENSES...")
    data = load_json_file(EXPENSES_FILE)
    
    transformed = [transform_expense(item, user_id) for item in data]
    
    batch_size = 100
    total = len(transformed)
    
    for i in range(0, total, batch_size):
        batch = transformed[i:i + batch_size]
        result = supabase.table("expenses").insert(batch).execute()
        print(f"  ✓ Inserted {min(i + batch_size, total)}/{total} expenses")
    
    print(f"  ✅ Migrated {total} expenses")


def migrate_incomes(supabase: Client, user_id: str):
    """Migrate incomes collection."""
    print("\n💰 Migrating INCOMES...")
    data = load_json_file(INCOMES_FILE)
    
    transformed = [transform_income(item, user_id) for item in data]
    
    batch_size = 100
    total = len(transformed)
    
    for i in range(0, total, batch_size):
        batch = transformed[i:i + batch_size]
        result = supabase.table("incomes").insert(batch).execute()
        print(f"  ✓ Inserted {min(i + batch_size, total)}/{total} incomes")
    
    print(f"  ✅ Migrated {total} incomes")


def migrate_savings(supabase: Client, user_id: str):
    """Migrate savings collection."""
    print("\n🏦 Migrating SAVINGS...")
    data = load_json_file(SAVINGS_FILE)
    
    transformed = [transform_savings(item, user_id) for item in data]
    
    batch_size = 100
    total = len(transformed)
    
    for i in range(0, total, batch_size):
        batch = transformed[i:i + batch_size]
        result = supabase.table("savings").insert(batch).execute()
        print(f"  ✓ Inserted {min(i + batch_size, total)}/{total} savings")
    
    print(f"  ✅ Migrated {total} savings")


def main():
    """Run the full migration."""
    print("=" * 50)
    print("MongoDB → Supabase Migration")
    print("=" * 50)
    
    # Validate configuration
    if USER_ID == "YOUR_USER_ID_HERE":
        print("❌ ERROR: Please set your USER_ID in the script!")
        print("   You can get this after signing up in the app.")
        return
    
    if SUPABASE_SERVICE_ROLE_KEY == "YOUR_SERVICE_ROLE_KEY_HERE":
        print("❌ ERROR: Please set your SUPABASE_SERVICE_ROLE_KEY!")
        print("   Find it in Lovable Cloud → Secrets")
        return
    
    try:
        supabase = get_supabase_client()
        print("✓ Connected to Supabase")
        
        # Run migrations in order
        migrate_budgets(supabase, USER_ID)
        migrate_expenses(supabase, USER_ID)
        migrate_incomes(supabase, USER_ID)
        migrate_savings(supabase, USER_ID)
        
        print("\n" + "=" * 50)
        print("🎉 Migration complete!")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        raise


if __name__ == "__main__":
    main()
