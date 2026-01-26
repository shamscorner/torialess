import { useState, useEffect, useRef, type FC, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Check, RotateCcw } from "lucide-react";

// --- Types ---
interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  children: TodoItem[];
}

interface TodoItemProps {
  todo: TodoItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddSub: (parentId: string) => void;
  onEdit: (id: string, newText: string) => void;
  depth: number;
}

// --- Constants & Defaults ---
const STORAGE_KEY = "blackboard_todo_v1";
const TITLE_STORAGE_KEY = "blackboard_todo_title_v1";
const INITIAL_DATA: TodoItem[] = [
  {
    id: "1",
    text: "Welcome to your Workspace",
    completed: false,
    children: [
      {
        id: "2",
        text: "Create a subtask by hovering and clicking the plus icon",
        completed: false,
        children: [],
      },
      {
        id: "3",
        text: "Delete tasks with the trash icon",
        completed: false,
        children: [],
      },
    ],
  },
  {
    id: "4",
    text: "Stay Focused. Stay Minimal.",
    completed: false,
    children: [],
  },
];

// --- Utility Functions ---
const generateId = (): string => Math.random().toString(36).substr(2, 9);

const updateNestedItems = (
  items: TodoItem[],
  id: string,
  updater: (item: TodoItem) => TodoItem,
): TodoItem[] => {
  return items.map((item) => {
    if (item.id === id) return updater(item);
    if (item.children.length > 0) {
      return {
        ...item,
        children: updateNestedItems(item.children, id, updater),
      };
    }
    return item;
  });
};

const deleteNestedItem = (items: TodoItem[], id: string): TodoItem[] => {
  return items.filter((item) => {
    if (item.id === id) return false;
    if (item.children.length > 0) {
      item.children = deleteNestedItem(item.children, id);
    }
    return true;
  });
};

// --- Sub-Component: TodoItem ---
const TodoItem = forwardRef<HTMLDivElement, TodoItemProps>(
  ({ todo, onToggle, onDelete, onAddSub, onEdit, depth }, ref) => {
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const internalInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      if (isEditing && internalInputRef.current) {
        internalInputRef.current.focus();
      }
    }, [isEditing]);

    const handleBlur = () => {
      setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") setIsEditing(false);
      if (e.key === "Escape") setIsEditing(false);
    };

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        // Note: Removed 'group' and hover handlers from this wrapper
        className="relative"
        style={{ marginLeft: depth > 0 ? `${depth * 2}rem` : 0 }}
      >
        {/* The visible row content - Hover logic moved here */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`
          relative group
          flex items-center gap-4 py-4 px-6 rounded-2xl transition-all duration-300
          ${isHovered ? "bg-white/5" : "bg-transparent"}
        `}
        >
          {/* Checkmark Circle */}
          <button
            onClick={() => onToggle(todo.id)}
            className={`
            w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 flex-shrink-0
            ${todo.completed ? "bg-white border-white" : "border-white/20 hover:border-white/50"}
          `}
          >
            {todo.completed && (
              <Check size={14} className="text-black stroke-[4px]" />
            )}
          </button>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                ref={internalInputRef}
                type="text"
                value={todo.text}
                onChange={(e) => onEdit(todo.id, e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent border-none p-0 text-xl font-medium text-white focus:ring-0"
              />
            ) : (
              <p
                onClick={() => setIsEditing(true)}
                className={`
                text-xl md:text-2xl font-medium truncate transition-all duration-500 cursor-text
                ${todo.completed ? "text-white/20 line-through" : `text-white/80 group-hover:${depth > 0 ? "text-yellow-400" : "text-orange-400"}`}
              `}
              >
                {todo.text}
              </p>
            )}
          </div>

          {/* Actions (Subtle Far Right) */}
          <div
            className={`
          flex items-center gap-3 transition-opacity duration-300 flex-shrink-0
          ${isHovered ? "opacity-100" : "opacity-0"}
        `}
          >
            <button
              onClick={() => onAddSub(todo.id)}
              className="p-1.5 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              title="Add Subtask"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={() => onDelete(todo.id)}
              className="p-1.5 text-white/10 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Recursive Children - Rendered OUTSIDE the hoverable div above */}
        {todo.children && todo.children.length > 0 && (
          <div className="relative mt-1">
            <div className="absolute left-[1.75rem] top-0 bottom-4 w-px bg-white/5" />
            <AnimatePresence mode="popLayout">
              {todo.children.map((child) => (
                <TodoItem
                  key={child.id}
                  todo={child}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onAddSub={onAddSub}
                  onEdit={onEdit}
                  depth={depth + 0.5}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    );
  },
);

TodoItem.displayName = "TodoItem";

export const FocusedTodos: FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });

  const [title, setTitle] = useState<string>(() => {
    const savedTitle = localStorage.getItem(TITLE_STORAGE_KEY);
    return savedTitle || "FOCUS.";
  });

  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");

  // Persist tasks
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  // Persist title
  useEffect(() => {
    localStorage.setItem(TITLE_STORAGE_KEY, title);
  }, [title]);

  // Handlers
  const addTodo = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      const newTodo: TodoItem = {
        id: generateId(),
        text: inputValue.trim(),
        completed: false,
        children: [],
      };
      setTodos([...todos, newTodo]);
      setInputValue("");
    }
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      updateNestedItems(prev, id, (item) => ({
        ...item,
        completed: !item.completed,
      })),
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => deleteNestedItem([...prev], id));
  };

  const addSubtask = (parentId: string) => {
    const newId = generateId();
    setTodos((prev) =>
      updateNestedItems(prev, parentId, (item) => ({
        ...item,
        children: [
          ...item.children,
          { id: newId, text: "New Subtask", completed: false, children: [] },
        ],
      })),
    );
  };

  const editTodoText = (id: string, newText: string) => {
    setTodos((prev) =>
      updateNestedItems(prev, id, (item) => ({ ...item, text: newText })),
    );
  };

  const resetAll = () => {
    setTodos(INITIAL_DATA);
    setTitle("FOCUS.");
    setShowConfirmReset(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-sans selection:bg-white/20">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full" />
      </div>

      {/* Header / Reset Button */}
      <header className="fixed top-0 left-0 w-full p-8 flex justify-between items-start z-50">
        <div className="flex-1" />
        <div className="relative">
          {!showConfirmReset ? (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="group flex items-center gap-2 text-xs uppercase tracking-widest text-white/20 hover:text-white/60 transition-all duration-300"
            >
              <RotateCcw
                size={14}
                className="group-hover:rotate-[-45deg] transition-transform duration-500"
              />
              Reset Workspace
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 bg-[#1a1a1a] border border-white/10 p-3 rounded-xl shadow-2xl"
            >
              <span className="text-xs font-medium text-white/70">
                Are you sure?
              </span>
              <div className="flex gap-2">
                <button
                  onClick={resetAll}
                  className="text-[10px] bg-white text-black px-3 py-1 rounded-md font-bold uppercase hover:bg-white/80 transition-colors"
                >
                  Yes, Reset
                </button>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  className="text-[10px] text-white/40 hover:text-white px-2 uppercase tracking-tighter"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto pt-32 pb-64 px-6 min-h-screen flex flex-col">
        {/* Sticky Editable Title */}
        <div className="sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md z-40 pt-4 pb-6 mb-12 border-b border-white/5">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent uppercase border-none text-4xl md:text-5xl font-black tracking-tighter text-white focus:ring-0 focus:outline-none p-0 selection:bg-white/20 transition-all"
            placeholder="Untitled Project"
          />
        </div>

        {/* New Item Input Area */}
        <div className="mb-16 group">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={addTodo}
            placeholder="Type something and press Enter..."
            className="w-full bg-transparent border-none text-2xl md:text-3xl font-medium placeholder:text-white/10 focus:ring-0 focus:outline-none transition-all"
          />
          <div className="h-px w-0 group-focus-within:w-full bg-gradient-to-r from-white/20 to-transparent transition-all duration-700" />
        </div>

        {/* List Content */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {todos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onAddSub={addSubtask}
                onEdit={editTodoText}
                depth={0}
              />
            ))}
          </AnimatePresence>

          {todos.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center"
            >
              <p className="text-white/20 italic text-lg">
                Empty space. Peace of mind.
              </p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};
