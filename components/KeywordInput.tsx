import { useState } from "react";
import { Input } from "@/components/ui/input";

interface KeywordInputProps {
  value: string[];
  onChange: (keywords: string[]) => void;
}

const KeywordInput = ({ value, onChange }: KeywordInputProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "," || e.key === " ") {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleAddKeyword = () => {
    const newKeyword = inputValue.trim();
    if (newKeyword) {
      onChange([...value, newKeyword]);
      setInputValue("");
    }
  };

  const handleRemoveKeyword = (index: number) => {
    const newKeywords = [...value];
    newKeywords.splice(index, 1);
    onChange(newKeywords);
  };

  return (
    <div className="flex flex-col gap-2">
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Add keyword (press , or space to add)"
        className="flex-1"
      />
      <div className="flex flex-wrap gap-2">
        {value.map((keyword, index) => (
          <div
            key={index}
            className="bg-gray-200 px-3 py-1 rounded-full text-gray-700 flex items-center"
          >
            {keyword}
            <button
              className="ml-2 text-gray-500 hover:text-gray-700"
              onClick={() => handleRemoveKeyword(index)}
            >
              x
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeywordInput;
