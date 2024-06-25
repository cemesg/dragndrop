import React, { useState, useRef } from 'react';
import { DndProvider, useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { v4 as uuidv4 } from 'uuid';

// Define a set of draggable components
const components = {
  Button: () => <button>Button</button>,
  Input: () => <input placeholder="Input" />,
  Text: () => <p>Text</p>,
  Div: () => <div>Div</div>
};

interface ItemType {
  id: string;
  type: keyof typeof components;
  children?: ItemType[];
}

interface DraggedItem extends ItemType {
  parentId: string | null;
}

export const DraggableItem: React.FC<{ item: ItemType; parentId: string | null; moveItem: (draggedItem: DraggedItem, newParentId: string | null) => void }> = ({ item, parentId, moveItem }) => {
  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: 'ITEM',
    hover: (draggedItem: DraggedItem, monitor: DropTargetMonitor) => {
      if (!ref.current) {
        return;
      }
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        return;
      }
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (draggedItem.id === item.id || draggedItem.parentId === item.id) {
        return;
      }

      if (hoverClientY > hoverMiddleY) {
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

  const Component = components[item.type];

  return (
    <div
      ref={ref}
      style={{
        opacity: isDragging ? 0.5 : 1,
        padding: '8px',
        margin: '4px',
        backgroundColor: 'lightblue',
        cursor: 'move',
      }}
    >
      <Component />
      {item.children && (
        <div style={{ paddingLeft: '16px' }}>
          {item.children.map((child) => (
            <DraggableItem key={child.id} item={child} parentId={item.id} moveItem={moveItem} />
          ))}
        </div>
      )}
    </div>
  );
};

const Container: React.FC<{ items: ItemType[]; moveItem: (draggedItem: DraggedItem, newParentId: string | null) => void; onDrop: (item: DraggedItem) => void }> = ({ items, moveItem, onDrop }) => {
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
        backgroundColor: 'lightgrey',
        minHeight: '200px',
        width: '200px',
      }}
    >
      {items.map((item) => (
        <DraggableItem key={item.id} item={item} parentId={null} moveItem={moveItem} />
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
        backgroundColor: 'red',
        color: 'white',
        minHeight: '50px',
        width: '200px',
        textAlign: 'center',
        lineHeight: '30px',
      }}
    >
      Trash
    </div>
  );
};

const DragAndDropDemo: React.FC = () => {
  const initialItems: ItemType[] = [
    { id: uuidv4(), type: 'Button', children: [] },
    { id: uuidv4(), type: 'Input', children: [] },
    { id: uuidv4(), type: 'Text', children: [] },
    { id: uuidv4(), type: 'Div', children: [] },
  ];

  const [availableItems] = useState<ItemType[]>(initialItems);
  const [containerItems, setContainerItems] = useState<ItemType[]>([]);

  const moveItem = (draggedItem: DraggedItem, newParentId: string | null) => {
    const removeItem = (items: ItemType[], id: string): ItemType[] => {
      return items
        .map(item => {
          if (item.children) {
            return { ...item, children: removeItem(item.children, id) };
          }
          return item;
        })
        .filter(item => item.id !== id);
    };

    const addItem = (items: ItemType[], newItem: ItemType, parentId: string | null): ItemType[] => {
      if (!parentId) {
        return [...items, newItem];
      }
      return items.map(item => {
        if (item.id === parentId) {
          return { ...item, children: [...(item.children || []), newItem] };
        }
        if (item.children) {
          return { ...item, children: addItem(item.children, newItem, parentId) };
        }
        return item;
      });
    };

    setContainerItems((prevItems) => {
      const removedItems = removeItem(prevItems, draggedItem.id);
      return addItem(removedItems, { ...draggedItem, id: draggedItem.id, children: draggedItem.children || [] }, newParentId);
    });
  };

  const handleDrop = (droppedItem: DraggedItem) => {
    setContainerItems((prevItems) => {
      if (!prevItems.some(item => item.id === droppedItem.id)) {
        const newItem: ItemType = { ...droppedItem, id: uuidv4() };
        return [...prevItems, newItem];
      }
      return prevItems;
    });
  };

  const handleTrashDrop = (droppedItem: DraggedItem) => {
    const removeItem = (items: ItemType[], id: string): ItemType[] => {
      return items
        .map(item => {
          if (item.children) {
            return { ...item, children: removeItem(item.children, id) };
          }
          return item;
        })
        .filter(item => item.id !== id);
    };

    setContainerItems((prevItems) => removeItem(prevItems, droppedItem.id));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px' }}>
        <div style={{ width: '200px', padding: '16px', backgroundColor: 'lightgrey' }}>
          <h3>Available Items</h3>
          {availableItems.map((item) => (
            <DraggableItem key={item.id} item={item} parentId={null} moveItem={() => {}} />
          ))}
        </div>
        <Container items={containerItems} moveItem={moveItem} onDrop={handleDrop} />
        <TrashBin onDrop={handleTrashDrop} />
      </div>
    </DndProvider>
  );
};

export default DragAndDropDemo;
