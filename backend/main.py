from fastapi import FastAPI, HTTPException, Depends
from typing import Annotated, List
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import SessionLocal, engine
import models
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import secrets

security = HTTPBasic()

ADMIN_USERNAME = "Cynthia"
ADMIN_PASSWORD = "garchomp123!"

def verify_auth(credentials: HTTPBasicCredentials = Depends(security)):
    is_username_correct = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    is_password_correct = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    
    if not (is_username_correct and is_password_correct):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

app = FastAPI()

origins = [
    'http://localhost:3000'
]

app.add_middleware(
    CORSMiddleware, 
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

class SupplierBase(BaseModel):
    supplier_name: str
    supplier_contact_person: str
    supplier_contact_number: str

class SupplierModel(SupplierBase):
    id: int

    class Config:
        from_attributes = True

class TransactionBase(BaseModel):
    product_name: str
    quantity: int
    price: float
    vat: bool
    category: str
    description: str
    date: str
    supplier_id: int


class TransactionModel(TransactionBase):
    id: int

    class Config: 
        from_attributes = True

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

models.Base.metadata.create_all(bind=engine)

@app.get("/transactions/{transaction_id}", response_model=TransactionModel)
async def get_transaction(
    transaction_id: int,
    db: db_dependency,
    username: str = Depends(verify_auth)
):
  
    transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(
            status_code=404,
            detail=f"Transaction with ID {transaction_id} not found"
        )
    return transaction

@app.post("/transactions", response_model=TransactionModel)
async def create_transaction(
    db: db_dependency,
    transaction: TransactionBase, 
    username: str = Depends(verify_auth)
):
    db_transaction = models.Transaction(**transaction.model_dump())
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

@app.get("/transactions", response_model=List[TransactionModel])
async def get_all_transactions(
    db: db_dependency,
    skip: int = 0, 
    limit: int = 100,
    username: str = Depends(verify_auth)
):
    transactions = db.query(models.Transaction).offset(skip).limit(limit).all()
    return transactions

@app.delete("/transactions/{transaction_id}")
async def delete_transaction(
    db: db_dependency,
    transaction_id: int, 
    username: str = Depends(verify_auth)
):
    transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    db.delete(transaction)
    db.commit()
    return {"message" : "Transaction delete successfully"}

@app.put("/transactions/{transaction_id}", response_model=TransactionModel)
async def update_transaction(
    db: db_dependency,
    transaction_id: int, 
    transaction_data: TransactionBase, 
    username: str = Depends(verify_auth)
):
    result = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).update(
        transaction_data.model_dump(),
        synchronize_session="fetch"
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    try:
        db.commit()
        return db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/suppliers", response_model=SupplierModel)
async def create_supplier(
    db: db_dependency,
    supplier: SupplierBase, 
    username: str = Depends(verify_auth)
):
    db_supplier = models.Supplier(**supplier.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@app.get("/suppliers", response_model=List[SupplierModel])
async def get_all_suppliers(
    db: db_dependency,
    skip: int = 0, 
    limit: int = 100,
    username: str = Depends(verify_auth)
):
    suppliers = db.query(models.Supplier).offset(skip).limit(limit).all()
    return suppliers

@app.get("/suppliers/{supplier_id}", response_model=SupplierModel)
async def get_supplier(
    db: db_dependency,
    supplier_id: int, 
    username: str = Depends(verify_auth)
):
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier

@app.put("/suppliers/{supplier_id}", response_model=SupplierModel)
async def update_supplier(
    db: db_dependency,
    supplier_id: int, 
    supplier_data: SupplierBase, 
    username: str = Depends(verify_auth)
):
    result = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).update(
        supplier_data.model_dump(),
        synchronize_session="fetch"
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Supplier not found")
        
    try:
        db.commit()
        return db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/suppliers/{supplier_id}")
async def delete_supplier(
    db: db_dependency,
    supplier_id: int, 
    username: str = Depends(verify_auth)
):
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    transactions = db.query(models.Transaction).filter(models.Transaction.supplier_id == supplier_id).first()
    if transactions:
        raise HTTPException(status_code=400, detail="Cannot delete supplier with existing transactions")
    
    db.delete(supplier)
    db.commit()
    return {"message": "Supplier deleted successfully"}