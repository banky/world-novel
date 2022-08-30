export const Input = () => {
  return (
    <div className="flex border-blue-500 border-2 rounded-xl focus-within:ring-red-600 focus-within:ring-2 p-2">
      <textarea
        placeholder="Add to the book!"
        className="w-full outline-none"
      />
      <button>Add</button>
    </div>
  );
};
