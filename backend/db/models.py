from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class SearchHistory(Base):
    __tablename__ = "search_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    query = Column(Text, nullable=False)
    result_summary = Column(Text, nullable=True)
    decision_action = Column(String(50), nullable=True)
    recommended_name = Column(Text, nullable=True)
    recommended_price = Column(String(50), nullable=True)
    products_json = Column(JSON, nullable=True)
    decision_json = Column(JSON, nullable=True)
    budget_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
