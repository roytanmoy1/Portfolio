"use client";

import { useEffect, useState } from "react";
import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	rectSortingStrategy,
	sortableKeyboardCoordinates,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FaGripVertical } from "react-icons/fa";
import styles from "./SortableGrid.module.css";

const orderItems = (currentIds, availableIds) => [
	...currentIds.filter((itemId) => availableIds.includes(itemId)),
	...availableIds.filter((itemId) => !currentIds.includes(itemId)),
];

const readStoredOrder = (storageKey, availableIds) => {
	try {
		const value = JSON.parse(localStorage.getItem(storageKey));
		return Array.isArray(value) ? orderItems(value, availableIds) : availableIds;
	} catch {
		return availableIds;
	}
};

const SortableItem = ({ id, label, children }) => {
	const {
		attributes,
		listeners,
		setActivatorNodeRef,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });

	return (
		<div
			ref={setNodeRef}
			className={`${styles.item} ${isDragging ? styles.dragging : ""}`}
			style={{ transform: CSS.Transform.toString(transform), transition }}
		>
			<button
				type="button"
				ref={setActivatorNodeRef}
				className={styles.handle}
				{...attributes}
				{...listeners}
				aria-label={`Move ${label}`}
				title={`Drag to move ${label}`}
			>
				<FaGripVertical aria-hidden="true" />
			</button>
			{children}
		</div>
	);
};

const SortableGrid = ({ items, className, storageKey, renderItem }) => {
	const availableIds = items.map((item) => item.id);
	const availableIdsKey = availableIds.join("\u001f");
	const [orderedIds, setOrderedIds] = useState(availableIds);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
	);

	useEffect(() => {
		const currentIds = availableIdsKey ? availableIdsKey.split("\u001f") : [];
		setOrderedIds(readStoredOrder(storageKey, currentIds));
	}, [availableIdsKey, storageKey]);

	const itemsById = new Map(items.map((item) => [item.id, item]));
	const displayIds = orderItems(orderedIds, availableIds);

	const handleDragEnd = ({ active, over }) => {
		if (!over || active.id === over.id) return;

		setOrderedIds((currentIds) => {
			const currentOrder = orderItems(currentIds, availableIds);
			const oldIndex = currentOrder.indexOf(active.id);
			const newIndex = currentOrder.indexOf(over.id);
			const nextOrder = arrayMove(currentOrder, oldIndex, newIndex);

			localStorage.setItem(storageKey, JSON.stringify(nextOrder));
			return nextOrder;
		});
	};

	return (
		<DndContext id={storageKey} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
			<SortableContext items={displayIds} strategy={rectSortingStrategy}>
				<div className={className}>
					{displayIds.map((itemId) => {
						const item = itemsById.get(itemId);
						return item ? (
							<SortableItem id={item.id} label={item.label} key={item.id}>
								{renderItem(item)}
							</SortableItem>
						) : null;
					})}
				</div>
			</SortableContext>
		</DndContext>
	);
};

export default SortableGrid;