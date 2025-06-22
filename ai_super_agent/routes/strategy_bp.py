"""Strategy blueprint for promoting plan insights to strategic documents."""
from flask import Blueprint, request, jsonify
import os
import time
import uuid
from sqlalchemy import create_engine, text

strategy_bp = Blueprint('strategy', __name__, url_prefix='/strategy')

class StrategyRepo:
    """Repository for strategy document operations."""
    
    @staticmethod
    def insert(markdown: str, author: str = 'System') -> str:
        """
        Insert a new strategy document.
        
        Args:
            markdown: Strategy content in markdown format
            author: Document author
            
        Returns:
            Generated strategy ID
        """
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise Exception("Database not configured")
        
        engine = create_engine(database_url)
        strategy_id = str(uuid.uuid4())
        
        with engine.connect() as conn:
            # Create strategies table if it doesn't exist
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS strategies (
                    id VARCHAR PRIMARY KEY,
                    content TEXT NOT NULL,
                    author VARCHAR NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """))
            conn.commit()
            
            # Insert the strategy document
            conn.execute(text("""
                INSERT INTO strategies (id, content, author, created_at, updated_at)
                VALUES (:id, :content, :author, NOW(), NOW())
            """), {
                "id": strategy_id,
                "content": markdown,
                "author": author
            })
            conn.commit()
        
        return strategy_id
    
    @staticmethod
    def get_all():
        """Get all strategy documents."""
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            return []
        
        engine = create_engine(database_url)
        
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, content, author, created_at, updated_at
                FROM strategies
                ORDER BY created_at DESC
            """)).fetchall()
            
            return [
                {
                    "id": row[0],
                    "content": row[1],
                    "author": row[2],
                    "created_at": row[3].isoformat() if row[3] else None,
                    "updated_at": row[4].isoformat() if row[4] else None
                }
                for row in result
            ]

@strategy_bp.route('/promote', methods=['POST'])
def promote():
    """Promote markdown content to a strategy document."""
    try:
        body = request.get_json()
        if not body or 'markdown' not in body:
            return jsonify({"error": "Markdown content required"}), 400
        
        author = body.get('author', 'System')
        strategy_id = StrategyRepo.insert(body['markdown'], author)
        
        return jsonify({
            "success": True,
            "strategy_id": strategy_id,
            "message": "Strategy document promoted successfully"
        }), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@strategy_bp.route('/list', methods=['GET'])
def list_strategies():
    """List all strategy documents."""
    try:
        strategies = StrategyRepo.get_all()
        return jsonify({"strategies": strategies})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@strategy_bp.route('/<strategy_id>', methods=['GET'])
def get_strategy(strategy_id):
    """Get a specific strategy document."""
    try:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            return jsonify({"error": "Database not configured"}), 500
        
        engine = create_engine(database_url)
        
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT id, content, author, created_at, updated_at
                FROM strategies
                WHERE id = :strategy_id
            """), {"strategy_id": strategy_id}).fetchone()
            
            if not result:
                return jsonify({"error": "Strategy not found"}), 404
            
            strategy = {
                "id": result[0],
                "content": result[1],
                "author": result[2],
                "created_at": result[3].isoformat() if result[3] else None,
                "updated_at": result[4].isoformat() if result[4] else None
            }
            
            return jsonify(strategy)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500