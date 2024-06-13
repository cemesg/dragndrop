import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface ItemType {
  id: string;
  name: string;
}

const DraggableItem: React.FC<{ item: ItemType; index: number; moveItem: (dragIndex: number, hoverIndex: number) => void }> = ({ item, index, moveItem }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: 'ITEM',
    hover: (draggedItem: { index: number; id: string; type: string }, monitor: DropTargetMonitor) => {
      if (!ref.current) {
        return;
      }
      const dragIndex = draggedItem.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveItem(dragIndex, hoverIndex);
      draggedItem.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: 'ITEM',
    item: { index, id: item.id, type: 'ITEM' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

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
      {item.name}
    </div>
  );
};

const Container: React.FC<{ items: ItemType[]; moveItem: (dragIndex: number, hoverIndex: number) => void; onDrop: (item: ItemType) => void }> = ({ items, moveItem, onDrop }) => {
  const [, drop] = useDrop({
    accept: 'ITEM',
    drop: (item: { id: string; index: number; name: string }) => {
      onDrop(item);
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
      {items.map((item, index) => (
        <DraggableItem key={item.id} item={item} index={index} moveItem={moveItem} />
      ))}
    </div>
  );
};

const TrashBin: React.FC<{ onDrop: (item: ItemType) => void }> = ({ onDrop }) => {
  const [, drop] = useDrop({
    accept: 'ITEM',
    drop: (item: { id: string, name:string}) => {
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
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    { id: '3', name: 'Item 3' },
  ];

  const [availableItems, setAvailableItems] = useState<ItemType[]>(initialItems);
  const [containerItems, setContainerItems] = useState<ItemType[]>([]);

  const moveItem = (dragIndex: number, hoverIndex: number) => {
    const updatedItems = [...containerItems];
    const [movedItem] = updatedItems.splice(dragIndex, 1);
    updatedItems.splice(hoverIndex, 0, movedItem);
    setContainerItems(updatedItems);
  };

  const handleDrop = (droppedItem: { id: string }) => {
    const item = availableItems.find((i) => i.id === droppedItem.id);
    if (item) {
      setAvailableItems((prevItems) => prevItems.filter((i) => i.id !== item.id));
      setContainerItems((prevItems) => [...prevItems, item]);
    }
  };

  const handleTrashDrop = (droppedItem: { id: string }) => {
    setContainerItems((prevItems) => prevItems.filter((i) => i.id !== droppedItem.id));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px' }}>
        <div style={{ width: '200px', padding: '16px', backgroundColor: 'lightgrey' }}>
          <h3>Available Items</h3>
          {availableItems.map((item, index) => (
            <DraggableItem key={item.id} item={item} index={index} moveItem={() => {}} />
          ))}
        </div>
        <Container items={containerItems} moveItem={moveItem} onDrop={handleDrop} />
        <TrashBin onDrop={handleTrashDrop} />
      </div>
    </DndProvider>
  );
};

export default DragAndDropDemo;
