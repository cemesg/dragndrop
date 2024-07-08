import React, { useState, useRef, useCallback, useEffect, ComponentType } from 'react';
import { DndProvider, useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { v4 as uuidv4 } from 'uuid';

const components = {
  Button: () => <button style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', backgroundColor: '#007BFF', color: 'white', cursor: 'pointer' }}>Button</button>,
  Input: () => <input placeholder="Input" style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }} />,
  Text: () => <p style={{ margin: '0', padding: '8px', borderRadius: '4px', backgroundColor: '#f5f5f5' }}>Text</p>,
  Div: ({ children }: { children?: React.ReactNode }) => <div style={{ padding: '8px', borderRadius: '4px', backgroundColor: '#e9ecef' }}>div{children}</div>,
  Row: ({ children }: { children?: React.ReactNode }) => <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', padding: '8px', borderRadius: '4px', backgroundColor: '#e9ecef' }}>row{children}</div>,
  Column: ({ children }: { children?: React.ReactNode }) => <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px', borderRadius: '4px', backgroundColor: '#e9ecef' }}>column{children}</div>,
};

const canHaveChildren = {
  Button: false,
  Input: false,
  Text: false,
  Div: true,
  Row: true,
  Column: true,
};

interface ItemType {
  id: string;
  type: keyof typeof components;
  children?: ItemType[];
}

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

// Example usage of HOC
const ClickableButton = withClickHandler(components.Button);
const ClickableInput = withClickHandler(components.Input);
const ClickableText = withClickHandler(components.Text);
const ClickableDiv = withClickHandler(components.Div);
const ClickableRow = withClickHandler(components.Row);
const ClickableColumn = withClickHandler(components.Column);

const ClickableComponents = {
  Button: ClickableButton,
  Input: ClickableInput,
  Text: ClickableText,
  Div: ClickableDiv,
  Row: ClickableRow,
  Column: ClickableColumn,
};

interface DraggedItem extends ItemType {
  parentId: string | null;
}

// Example usage in DragAndDropDemo
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
      onClick={() => onClick(item)}
    >
      <ClickableComponent>
        {item?.children?.map((child) => (
          <DraggableItem key={child.id} item={child} parentId={item.id} moveItem={moveItem} onClick={onClick} />
        ))}
      </ClickableComponent>
    </div>
  );
};

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

const renderHtml = (items: ItemType[]): string => {
  const renderElement = (item: ItemType): string => {
    const childrenHtml = item.children?.map(renderElement).join('') || '';
    return `<${item.type.toLowerCase()}>${childrenHtml}</${item.type.toLowerCase()}>`;
  };

  return items.map(renderElement).join('');
};

const Preview: React.FC<{ items: ItemType[] }> = ({ items }) => {
  const renderPreview = (item: ItemType): JSX.Element => {
    const Component = components[item.type];
    return (
      <Component key={item.id}>
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

const DragAndDropDemo: React.FC = () => {
  const initialItems: ItemType[] = [
    { id: uuidv4(), type: 'Button', children: [] },
    { id: uuidv4(), type: 'Input', children: [] },
    { id: uuidv4(), type: 'Text', children: [] },
    { id: uuidv4(), type: 'Div', children: [] },
    { id: uuidv4(), type: 'Row', children: [] },
    { id: uuidv4(), type: 'Column', children: [] },
  ];

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
    if (selectedItem) {
      const updatedSelectedItem = containerItems.find(item => item.id === selectedItem.id) || null;
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

  useEffect(() => {
    setAvailableItems([
      { id: uuidv4(), type: 'Button', children: [] },
      { id: uuidv4(), type: 'Input', children: [] },
      { id: uuidv4(), type: 'Text', children: [] },
      { id: uuidv4(), type: 'Div', children: [] },
      { id: uuidv4(), type: 'Row', children: [] },
      { id: uuidv4(), type: 'Column', children: [] },
    ]);
  }, [containerItems]);

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
            <div>
              <p><strong>Type:</strong> {selectedItem.type}</p>
              <p><strong>ID:</strong> {selectedItem.id}</p>
              {selectedItem.children && (
                <div>
                  <strong>Children:</strong>
                  <TreeView items={selectedItem.children} />
                </div>
              )}
            </div>
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

export default DragAndDropDemo;
