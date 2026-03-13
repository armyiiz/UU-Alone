import React from 'react';

const Card = ({ card, isHidden = false, onClick, selected = false }) => {
  if (!card && !isHidden) return <div className="w-24 h-36 bg-gray-800 rounded shadow-md border border-gray-700 flex items-center justify-center text-xs text-gray-500">Empty</div>;
  if (isHidden) return <div className="w-24 h-36 bg-purple-900 rounded shadow-md border-2 border-purple-500 flex flex-col items-center justify-center text-sm font-bold shadow-purple-500/50">Unstable<br/>Unicorns</div>;

  const typeColorMap = {
    'Baby Unicorn': 'bg-pink-200 border-pink-400 text-pink-900',
    'Basic Unicorn': 'bg-blue-100 border-blue-400 text-blue-900',
    'Magical Unicorn': 'bg-purple-100 border-purple-400 text-purple-900',
    'Magic': 'bg-green-100 border-green-400 text-green-900',
    'Downgrade': 'bg-yellow-100 border-yellow-400 text-yellow-900',
    'Upgrade': 'bg-orange-100 border-orange-400 text-orange-900',
    'Instant': 'bg-red-100 border-red-400 text-red-900'
  };

  const colorClass = typeColorMap[card.type] || 'bg-gray-100 border-gray-400 text-gray-900';

  return (
    <div
      className={`relative w-32 h-48 rounded-md shadow-lg border-2 flex flex-col p-2 cursor-pointer transition-transform hover:-translate-y-2 ${colorClass} ${selected ? 'ring-4 ring-yellow-400' : ''}`}
      onClick={() => onClick && onClick(card)}
    >
      {/* Header */}
      <div className="text-xs font-bold leading-tight mb-1 truncate" title={card.name}>{card.name}</div>
      <div className="text-[10px] italic mb-1">{card.type}</div>

      {/* Image Placeholder */}
      <div className="flex-grow bg-white/50 rounded flex items-center justify-center mb-1 overflow-hidden">
        {card.imageUrl ? (
           <img src={card.imageUrl} alt={card.name} className="object-cover w-full h-full" />
        ) : (
           <span className="text-2xl opacity-50 text-black">🦄</span>
        )}
      </div>

      {/* Effect Text */}
      <div className="text-[9px] leading-tight overflow-hidden text-ellipsis h-12">
        {card.effectText || "ไม่มีผลอะไร"}
      </div>
    </div>
  );
};

export default Card;