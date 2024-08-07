import React, { useState, useRef, useCallback, useEffect, ComponentType } from 'react';
import { DndProvider, useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { v4 as uuidv4 } from 'uuid';
import data from '../nodeModulesList.json'

// #region componentsList.ts

interface ComponentDefinition {
  type: string;
  component: ComponentType<{ children?: React.ReactNode; [key: string]: any }>;
  canHaveChildren: boolean;
  editableProps: { [key: string]: string }; // key is prop name, value is prop type (e.g., 'string')
}

const componentDefinitions : ComponentDefinition[]= [
  {
    type: 'Button',
    component: ({ text }) => <button style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#007BFF', color: 'white', cursor: 'pointer' }}>{text || 'Button'}</button>,
    canHaveChildren: false,
    editableProps: { text: 'string' },
  },
  {
    type: 'Input',
    component: ({ placeholder }) => <input placeholder={placeholder || 'Input'} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }} />,
    canHaveChildren: false,
    editableProps: { placeholder: 'string' },
  },
  {
    type: 'Text',
    component: ({ text }) => <p style={{ margin: '0', padding: '8px', borderRadius: '4px', backgroundColor: '#f5f5f5' }}>{text || 'Text'}</p>,
    canHaveChildren: false,
    editableProps: { text: 'string' },
  },
  {
    type: 'Div',
    component: ({ children }) => <div style={{ padding: '8px', borderRadius: '4px', backgroundColor: '#e9ecef' }}>div{children}</div>,
    canHaveChildren: true,
    editableProps: {},
  },
  {
    type: 'Row',
    component: ({ children }) => <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', padding: '8px', borderRadius: '4px', backgroundColor: '#e9ecef' }}>row{children}</div>,
    canHaveChildren: true,
    editableProps: {},
  },
  {
    type: 'Column',
    component: ({ children }) => <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px', borderRadius: '4px', backgroundColor: '#e9ecef' }}>column{children}</div>,
    canHaveChildren: true,
    editableProps: {},
  },
];

const components = Object.fromEntries(componentDefinitions.map(({ type, component }) => [type, component]));
const canHaveChildren = Object.fromEntries(componentDefinitions.map(({ type, canHaveChildren }) => [type, canHaveChildren]));
const editableProps = Object.fromEntries(componentDefinitions.map(({ type, editableProps }) => [type, editableProps]));
// #endregion

// #region withClickHandler.ts
function withClickHandler<T>(WrappedComponent: ComponentType<T>) {
  return (props: T & { onClick?: () => void }) => {
    const handleClick = () => {
      if (props.onClick) {
        props.onClick();
      }
    };

    return (
      <div onClick={handleClick} style={{ cursor: 'pointer' }}>
        <WrappedComponent {...props} />
      </div>
    );
  };
}
// #endregion

// #region ClickableComponents.ts
const ClickableComponents = Object.fromEntries(
  Object.entries(components).map(([key, component]) => [key, withClickHandler(component)])
);
// #endregion

// #region DraggableItem.ts
interface ItemType {
  id: string;
  type: keyof typeof components;
  props: { [key: string]: any };
  children?: ItemType[];
}

interface DraggedItem extends ItemType {
  parentId: string | null;
}

const DraggableItem: React.FC<{ item: ItemType; parentId: string | null; moveItem: (draggedItem: DraggedItem, newParentId: string | null) => void; onClick: (item: ItemType) => void }> = ({ item, parentId, moveItem, onClick }) => {
  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: 'ITEM',
    hover: (draggedItem: DraggedItem, monitor: DropTargetMonitor) => {
      if (!ref.current) return;
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (draggedItem.id === item.id || draggedItem.parentId === item.id) return;

      if (hoverClientY > hoverMiddleY && canHaveChildren[item.type]) {
        moveItem(draggedItem, item.id);
        draggedItem.parentId = item.id;
      }
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'ITEM',
    item: { ...item, parentId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  const ClickableComponent = ClickableComponents[item.type];

  return (
    <div
      ref={ref}
      style={{
        opacity: isDragging ? 0.5 : 1,
        padding: canHaveChildren[item.type] ? '8px' : '8px 16px',
        margin: '4px',
        border: '1px dashed #333',
        borderRadius: '4px',
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        cursor: 'move',
        minWidth: '10px',
        minHeight: '10px',
        display: canHaveChildren[item.type] ? 'flex' : 'block',
        flexDirection: canHaveChildren[item.type] && item.type === 'Row' ? 'row' : 'column',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(item);
      }}
    >
      <ClickableComponent {...item.props}>
        {item?.children?.map((child) => (
          <DraggableItem key={child.id} item={child} parentId={item.id} moveItem={moveItem} onClick={onClick} />
        ))}
      </ClickableComponent>
    </div>
  );
};
// #endregion

// #region Container.ts
const Container: React.FC<{ items: ItemType[]; moveItem: (draggedItem: DraggedItem, newParentId: string | null) => void; onDrop: (item: DraggedItem) => void; onClick: (item: ItemType) => void }> = ({ items, moveItem, onDrop, onClick }) => {
  const [, drop] = useDrop({
    accept: 'ITEM',
    drop: (item: DraggedItem, monitor) => {
      if (!monitor.didDrop()) {
        onDrop(item);
      }
    },
  });

  return (
    <div
      ref={drop}
      style={{
        padding: '16px',
        margin: '8px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        minHeight: '1000px',
        width: '1000px',
      }}
    >
      {items.map((item) => (
        <DraggableItem key={item.id} item={item} parentId={null} moveItem={moveItem} onClick={onClick} />
      ))}
    </div>
  );
};
// #endregion

// #region TrashBin.ts
const TrashBin: React.FC<{ onDrop: (item: DraggedItem) => void }> = ({ onDrop }) => {
  const [, drop] = useDrop({
    accept: 'ITEM',
    drop: (item: DraggedItem) => {
      onDrop(item);
    },
  });

  return (
    <div
      ref={drop}
      style={{
        padding: '16px',
        margin: '8px',
        backgroundColor: '#dc3545',
        color: 'white',
        borderRadius: '8px',
        textAlign: 'center',
        lineHeight: '30px',
        minHeight: '50px',
        width: '200px',
      }}
    >
      Trash
    </div>
  );
};
// #endregion

// #region TreeView.ts
const TreeView: React.FC<{ items: ItemType[] }> = ({ items }) => {
  return (
    <ul style={{ listStyleType: 'none', paddingLeft: '16px' }}>
      {items.map(item => (
        <li key={item.id}>
          <span>{item.type}</span>
          {item.children && item.children.length > 0 && <TreeView items={item.children} />}
        </li>
      ))}
    </ul>
  );
};
// #endregion

// #region utils.ts
const renderHtml = (items: ItemType[]): string => {
  const renderElement = (item: ItemType): string => {
    const childrenHtml = item.children?.map(renderElement).join('') || '';
    return `<${item.type}>${childrenHtml}</${item.type}>`;
  };

  return items.map(renderElement).join('');
};
// #endregion

// #region Preview.ts
const Preview: React.FC<{ items: ItemType[] }> = ({ items }) => {
  const renderPreview = (item: ItemType): JSX.Element => {
    const Component = components[item.type];
    return (
      <Component key={item.id} {...item.props}>
        {canHaveChildren[item.type] && item.children && item.children.map(renderPreview)}
      </Component>
    );
  };

  return (
    <div
      style={{
        padding: '16px',
        margin: '8px',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #ddd',
        minHeight: '1000px',
        width: '1000px',
      }}
    >
      {items.map(renderPreview)}
    </div>
  );
};
// #endregion

// #region EditableProperties.tsx
const EditableProperties: React.FC<{ selectedItem: ItemType; onChange: (key: string, value: any) => void }> = ({ selectedItem, onChange }) => {
  if (!selectedItem) {
    return <p>No item selected</p>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange(name, value);
  };

  const componentEditableProps = editableProps[selectedItem.type];

  return (
    <div>
      <p><strong>Type:</strong> {selectedItem.type}</p>
      <p><strong>ID:</strong> {selectedItem.id}</p>
      {Object.entries(componentEditableProps).map(([propName, propType]) => (
        <div key={propName}>
          <label>{propName}: </label>
          <input name={propName} value={selectedItem.props[propName] || ''} onChange={handleChange} />
        </div>
      ))}
    </div>
  );
};
// #endregion

// #region DragAndDropDemo.tsx
const DragAndDropDemo: React.FC = () => {
  const initialItems: ItemType[] = componentDefinitions.map(def => ({ id: uuidv4(), type: def.type, props: {}, children: [] }));

  const [availableItems, setAvailableItems] = useState<ItemType[]>(initialItems);
  const [containerItems, setContainerItems] = useState<ItemType[]>([]);
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);

  const moveItem = useCallback((draggedItem: DraggedItem, newParentId: string | null) => {
    setContainerItems(prevItems => {
      const removeItem = (items: ItemType[], id: string): ItemType[] => {
        return items
          .map(item => ({
            ...item,
            children: item.children ? removeItem(item.children, id) : [],
          }))
          .filter(item => item.id !== id);
      };

      const addItem = (items: ItemType[], newItem: ItemType, parentId: string | null): ItemType[] => {
        if (!parentId) {
          return [...items, newItem];
        }
        return items.map(item => ({
          ...item,
          children: item.id === parentId
            ? [...(item.children || []), newItem]
            : item.children ? addItem(item.children, newItem, parentId) : [],
        }));
      };

      const removedItems = removeItem(prevItems, draggedItem.id);
      return addItem(removedItems, { ...draggedItem, children: draggedItem.children || [] }, newParentId);
    });
  }, []);

  useEffect(() => {
    const findItemById = (items: ItemType[], id: string): ItemType | null => {
      for (const item of items) {
        if (item.id === id) {
          return item;
        }
        if (item.children) {
          const found = findItemById(item.children, id);
          if (found) {
            return found;
          }
        }
      }
      return null;
    };

    if (selectedItem) {
      const updatedSelectedItem = findItemById(containerItems, selectedItem.id);
      setSelectedItem(updatedSelectedItem);
    }
  }, [containerItems, selectedItem]);

  const handleDrop = useCallback((droppedItem: DraggedItem) => {
    setContainerItems(prevItems => {
      if (!prevItems.some(item => item.id === droppedItem.id)) {
        return [...prevItems, { ...droppedItem, id: uuidv4() }];
      }
      return prevItems;
    });
  }, []);

  const handleTrashDrop = useCallback((droppedItem: DraggedItem) => {
    setContainerItems(prevItems => {
      const removeItem = (items: ItemType[], id: string): ItemType[] => {
        return items
          .map(item => ({
            ...item,
            children: item.children ? removeItem(item.children, id) : [],
          }))
          .filter(item => item.id !== id);
      };
      return removeItem(prevItems, droppedItem.id);
    });
  }, []);

  const handlePrintHtml = () => {
    const html = renderHtml(containerItems);
    console.log(html);
    alert(html);
  };

  const handleItemClick = (item: ItemType) => {
    setSelectedItem(selectedItem?.id === item.id ? null : item);
  };

  const handlePropertyChange = (key: string, value: any) => {
    setContainerItems(prevItems => {
      const updateItemProps = (items: ItemType[]): ItemType[] => {
        return items.map(item => {
          if (item.id === selectedItem?.id) {
            return { ...item, props: { ...item.props, [key]: value } };
          }
          if (item.children) {
            return { ...item, children: updateItemProps(item.children) };
          }
          return item;
        });
      };
      return updateItemProps(prevItems);
    });
  };

  useEffect(() => {
    setAvailableItems(componentDefinitions.map(def => ({ id: uuidv4(), type: def.type, props: {}, children: [] })));
  }, [containerItems]);

  useEffect(() => {
    //alert(JSON.stringify(data))
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px' }}>
        <div style={{ width: '200px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ marginBottom: '16px' }}>Available Items</h3>
          {availableItems.map((item) => (
            <DraggableItem key={item.id} item={item} parentId={null} moveItem={() => {}} onClick={handleItemClick} />
          ))}
        </div>
        <Container items={containerItems} moveItem={moveItem} onDrop={handleDrop} onClick={handleItemClick} />
        <TrashBin onDrop={handleTrashDrop} />
        <div style={{ width: '200px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ marginBottom: '16px' }}>Tree View</h3>
          <TreeView items={containerItems} />
        </div>
        <div style={{ width: '200px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ marginBottom: '16px' }}>Selected Item</h3>
          {selectedItem ? (
            <EditableProperties selectedItem={selectedItem} onChange={handlePropertyChange} />
          ) : (
            <p>No item selected</p>
          )}
        </div>
      </div>
      <button onClick={handlePrintHtml} style={{ marginTop: '16px', padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#007BFF', color: 'white', cursor: 'pointer' }}>
        Print HTML
      </button>
      <h3 style={{ margin: '16px 0' }}>Preview</h3>
      <Preview items={containerItems} />
    </DndProvider>
  );
};
// #endregion

export default DragAndDropDemo;
