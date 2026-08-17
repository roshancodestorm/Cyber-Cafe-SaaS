import os
import glob
import importlib
from sqlalchemy import inspect

models_dir = 'app/models'
pyc_files = glob.glob(os.path.join(models_dir, '*.pyc'))

def type_to_string(type_obj):
    s = str(type_obj)
    if 'UUID' in s:
        return 'UUID(as_uuid=True)'
    if 'VARCHAR' in s or 'String' in s:
        return 'String'
    if 'DATETIME' in s or 'DateTime' in s:
        return 'DateTime'
    if 'INTEGER' in s or 'Integer' in s:
        return 'Integer'
    if 'BOOLEAN' in s or 'Boolean' in s:
        return 'Boolean'
    if 'JSON' in s:
        return 'JSON'
    if 'TEXT' in s or 'Text' in s:
        return 'Text'
    if 'NUMERIC' in s or 'Numeric' in s:
        return 'Numeric'
    if 'FLOAT' in s or 'Float' in s:
        return 'Float'
    return s

modules = []
for pyc in pyc_files:
    module_name = os.path.basename(pyc).replace('.pyc', '')
    if module_name in ('base', '__init__'):
        continue
        
    try:
        mod = importlib.import_module(f'app.models.{module_name}')
        modules.append((module_name, mod))
    except Exception as e:
        print(f"Failed to import {module_name}: {e}")

for module_name, mod in modules:
    for attr_name in dir(mod):
        attr = getattr(mod, attr_name)
        if isinstance(attr, type) and hasattr(attr, '__tablename__'):
            # It's a model class
            print(f"Reconstructing {module_name}.py (Class {attr.__name__})")
            
            lines = [
                "import uuid",
                "from datetime import datetime",
                "from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, JSON, Boolean, Numeric, Float",
                "from sqlalchemy import Uuid as UUID",
                "from sqlalchemy.orm import relationship",
                "from app.models.base import Base",
                "",
                f"class {attr.__name__}(Base):",
                f"    __tablename__ = '{attr.__tablename__}'",
                ""
            ]
            
            insp = inspect(attr)
            
            # Columns
            for col in insp.columns:
                args = [type_to_string(col.type)]
                if col.foreign_keys:
                    for fk in col.foreign_keys:
                        args.append(f"ForeignKey('{fk.target_fullname}')")
                
                if col.primary_key:
                    args.append("primary_key=True")
                if not col.nullable and not col.primary_key:
                    args.append("nullable=False")
                elif col.nullable:
                    args.append("nullable=True")
                    
                if col.index:
                    args.append("index=True")
                if col.unique:
                    args.append("unique=True")
                    
                if col.default is not None:
                    if hasattr(col.default, 'arg'):
                        arg = col.default.arg
                        if callable(arg):
                            if arg.__name__ == 'uuid4':
                                args.append("default=uuid.uuid4")
                            elif arg.__name__ == 'utcnow':
                                args.append("default=datetime.utcnow")
                            else:
                                args.append(f"default={arg.__name__}")
                        else:
                            if isinstance(arg, str):
                                args.append(f"default='{arg}'")
                            else:
                                args.append(f"default={arg}")
                
                if col.onupdate is not None:
                     args.append("onupdate=datetime.utcnow")
                
                lines.append(f"    {col.name} = Column({', '.join(args)})")
                
            # Relationships
            for rel in insp.relationships:
                lines.append(f"    {rel.key} = relationship('{rel.mapper.class_.__name__}')")
                
            lines.append("")
            
            with open(f"app/models/{module_name}.py", "w", encoding="utf-8") as f:
                f.write("\n".join(lines))
                
print("Done reconstructing.")
