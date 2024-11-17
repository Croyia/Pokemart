from database import Base
from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship

class Transaction(Base):
    __tablename__ = 'transactions'

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String)
    quantity = Column(Integer)
    price = Column(Float)
    vat = Column(Boolean)
    category = Column(String)
    description = Column(String)
    date = Column(String)
    supplier_id = Column(Integer, ForeignKey('suppliers.id'))

    supplier = relationship("Supplier", back_populates="transactions")



class Supplier(Base):
    __tablename__ = 'suppliers'

    id = Column(Integer, primary_key=True, index=True)
    supplier_name = Column(String)
    supplier_contact_person = Column(String)
    supplier_contact_number = Column(String)

    transactions = relationship("Transaction", back_populates="supplier")
