import React, { useState, useEffect } from 'react';
import Card from './Card';
import { useGameStore } from '../store/gameStore';
import { evaluateBotAction } from '../utils/aiDecision';

export default function GameBoard() {
  const {
    deck,
    discardPile,
    nursery,
    player,
    bot,
    turnState,
    modifiers,
    loading,
    winner,
    initializeGame,
    drawCard,
    advancePhase,
    playCard,
    discardCard,
    destroyCard,
    sacrificeCard
  } = useGameStore();

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const [selectedCard, setSelectedCard] = useState(null);
  const [inspectCard, setInspectCard] = useState(null);

  // --- Player Actions ---
  const handlePlayerDrawPhase = () => {
    if (turnState.currentPlayer !== 'player' || turnState.phase !== 'draw') return;
    drawCard('player');
    advancePhase(); // Auto move to action
  };

  const handlePlayerPlayCard = (cardToPlay) => {
    if (turnState.currentPlayer !== 'player' || turnState.phase !== 'action') return;

    // Remove old limitation and let the game engine handle it
    playCard('player', cardToPlay);
    advancePhase();
  };

  const handlePlayerActionDraw = () => {
    if (turnState.currentPlayer !== 'player' || turnState.phase !== 'action') return;
    drawCard('player');
    advancePhase();
  };

  const handlePlayerDiscard = (cardToDiscard) => {
    if (turnState.currentPlayer !== 'player' || turnState.phase !== 'end') return;
    discardCard('player', cardToDiscard);
  };

  const handlePlayerEndPhaseReady = () => {
    if (turnState.currentPlayer !== 'player' || turnState.phase !== 'end') return;
    if (player.hand.length > 7) {
      alert("You must discard down to 7 cards!");
      return;
    }
    advancePhase(); // Ends turn
  };

  const handleDestroyCard = (targetPlayer, cardToDestroy, location) => {
    destroyCard(targetPlayer, cardToDestroy, location);
    setInspectCard(null); // close inspect if destroyed
  };

  const handleSacrificeCard = (targetPlayer, cardToSacrifice, location) => {
    sacrificeCard(targetPlayer, cardToSacrifice, location);
    setInspectCard(null); // close inspect if sacrificed
  };

  // Bot Turn Effect
  useEffect(() => {
    if (winner || loading) return;

    if (turnState.currentPlayer === 'bot') {
      const timerId = setTimeout(() => {
         handleBotTurn();
      }, 1000);
      return () => clearTimeout(timerId);
    }
  }, [turnState, winner, loading]);

  // --- Bot Actions ---
  const handleBotTurn = () => {
    if (turnState.phase === 'beginning') {
      advancePhase();
    } else if (turnState.phase === 'draw') {
      drawCard('bot');
      advancePhase();
    } else if (turnState.phase === 'action') {

      const gameState = useGameStore.getState();
      const decision = evaluateBotAction(gameState);

      if (decision.action === 'play') {
        playCard('bot', decision.card);
      } else {
        drawCard('bot');
      }

      advancePhase();
    } else if (turnState.phase === 'end') {
      // Discard randomly if over 7
      const botHand = useGameStore.getState().bot.hand;
      if (botHand.length > 7) {
        const cardsToDiscardCount = botHand.length - 7;
        for (let i = 0; i < cardsToDiscardCount; i++) {
           const discarded = botHand[botHand.length - 1 - i]; // Simple pop from end
           discardCard('bot', discarded);
        }
      }
      advancePhase();
    }
  };

  if (loading) return <div className="h-full w-full flex items-center justify-center text-xl">Loading Deck...</div>;
  if (winner) return <div className="h-full w-full flex items-center justify-center text-4xl text-green-400 font-bold">{winner} Wins!</div>;

  return (
    <div className="flex h-full w-full text-sm">
      {/* LEFT PANEL: Inspection (25% Width) */}
      <div className="w-1/4 h-full bg-gray-800 border-r-2 border-slate-700 flex flex-col p-4 shadow-xl z-20 overflow-y-auto">
        {inspectCard ? (
          <>
            <div className="text-xl font-bold mb-1 text-yellow-400">{inspectCard.name}</div>
            <div className="text-sm italic text-gray-400 mb-4">{inspectCard.type}</div>

            <div className="w-full aspect-[5/7] bg-white/10 rounded-lg flex items-center justify-center mb-4 overflow-hidden border border-gray-600 shadow-lg">
              {inspectCard.imageUrl ? (
                <img src={inspectCard.imageUrl} alt={inspectCard.name} className="object-cover w-full h-full" />
              ) : (
                <span className="text-6xl opacity-50 text-black">🦄</span>
              )}
            </div>

            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 shadow-inner flex-1 mb-4">
              <h3 className="font-bold text-gray-300 mb-2 border-b border-gray-700 pb-1">Effect / Rules</h3>
              <p className="text-base text-gray-200 leading-relaxed whitespace-pre-wrap">
                {inspectCard.effectText || "ไม่มีผลอะไร"}
              </p>
            </div>

            {/* Test Actions for Step 2 Architecture */}
            <div className="flex flex-col gap-2">
               {/* Check if it's in player's stable/upgrades/downgrades */}
               {player.stable.find(c => c.instanceId === inspectCard.instanceId) && (
                 <>
                   <button onClick={() => handleSacrificeCard('player', inspectCard, 'stable')} className="px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded font-bold text-white transition">Sacrifice</button>
                   <button onClick={() => handleDestroyCard('player', inspectCard, 'stable')} className="px-3 py-2 bg-red-600 hover:bg-red-500 rounded font-bold text-white transition">Destroy (by opponent)</button>
                 </>
               )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 opacity-50">
            <span className="text-6xl mb-4">🔍</span>
            <p className="text-center px-4 text-lg">Right-click any card to inspect its details and Thai translation.</p>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Main Game Board (75% Width) */}
      <div className="w-3/4 h-full flex flex-col relative bg-slate-900">

        {/* TOP AREA: Bot's Side (30vh) */}
        <div className="h-[30vh] border-b border-slate-700 p-2 flex flex-col justify-between">
           <div className="flex justify-between items-center text-xs text-red-400 px-4">
              <div className="font-bold">Bot's Hand ({bot.hand.length})</div>
              <div className="font-bold">Stable: {bot.stable.length}/7 {modifiers.bot.unicornsAreCats && "(CATS!)"}</div>
           </div>

           {/* Bot Hand (Hidden, fanned slightly) */}
           <div className="flex justify-center items-start h-20 -mb-6 z-10">
             {bot.hand.map((c, i) => (
               <div key={i} className={`h-full ${i > 0 ? '-ml-8' : ''}`}>
                 <Card isHidden={true} />
               </div>
             ))}
           </div>

           {/* Bot Field (Upgrades + Stable + Downgrades) */}
           <div className="flex-1 flex flex-col items-center justify-center gap-1 px-4">
              {bot.upgrades.length === 0 && bot.stable.length === 0 && bot.downgrades.length === 0 ? (
                <div className="text-xs text-gray-600 italic mt-4">Empty Field</div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-1">
                  {/* Upgrades Row */}
                  {bot.upgrades.length > 0 && (
                    <div className="flex gap-1 h-[8vh] justify-center items-end opacity-80">
                      {bot.upgrades.map(c => (
                        <div key={c.instanceId} className="h-full">
                           <Card card={c} onContextMenu={setInspectCard} />
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Stable Row */}
                  <div className="flex gap-2 h-[12vh] justify-center items-center">
                    {bot.stable.map(c => (
                      <div key={c.instanceId} className="h-full">
                         <Card card={c} onContextMenu={setInspectCard} />
                      </div>
                    ))}
                  </div>
                  {/* Downgrades Row */}
                  {bot.downgrades.length > 0 && (
                    <div className="flex gap-1 h-[8vh] justify-center items-start opacity-80 filter sepia-[.3]">
                      {bot.downgrades.map(c => (
                        <div key={c.instanceId} className="h-full">
                           <Card card={c} onContextMenu={setInspectCard} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
           </div>
        </div>

        {/* MIDDLE AREA: Battlefield (20vh) */}
        <div className="h-[20vh] bg-slate-800 flex items-center justify-between px-8 shadow-inner border-b border-slate-700 relative z-0">

          {/* Deck & Discard */}
          <div className="flex gap-4 h-[15vh]">
             <div className="h-full aspect-[5/7] bg-purple-900 rounded-md shadow-md border-2 border-purple-500 flex flex-col items-center justify-center font-bold text-xs cursor-pointer hover:bg-purple-800">
                Deck<br/>({deck.length})
             </div>
             <div className="h-full aspect-[5/7]">
               {discardPile.length > 0 ? (
                 <Card card={discardPile[discardPile.length - 1]} onContextMenu={setInspectCard} />
               ) : (
                 <div className="h-full w-full bg-gray-800 rounded-md border border-gray-600 flex items-center justify-center text-xs text-gray-500">Discard</div>
               )}
             </div>
          </div>

          {/* Phase & Controls Center */}
          <div className="flex flex-col items-center justify-center bg-slate-900 px-6 py-2 rounded-lg border-2 border-slate-600 shadow-xl min-w-[250px]">
             <div className="text-lg font-bold mb-1 uppercase tracking-widest text-blue-400">
               {turnState.currentPlayer === 'player' ? 'Your Turn' : "Bot's Turn"}
             </div>
             <div className="text-sm mb-3 text-slate-300">Phase: {turnState.phase.toUpperCase()}</div>

             {turnState.currentPlayer === 'player' && (
                <div className="flex gap-2 text-xs">
                  {turnState.phase === 'beginning' && (
                    <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded font-bold transition" onClick={advancePhase}>Start Turn</button>
                  )}
                  {turnState.phase === 'draw' && (
                    <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded font-bold transition" onClick={handlePlayerDrawPhase}>Draw Card</button>
                  )}
                  {turnState.phase === 'action' && (
                    <>
                      <button
                        className={`px-3 py-1.5 rounded font-bold transition ${selectedCard ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-600 cursor-not-allowed text-gray-400'}`}
                        onClick={() => {
                          if (selectedCard) {
                            handlePlayerPlayCard(selectedCard);
                            setSelectedCard(null);
                          }
                        }}
                        disabled={!selectedCard}
                      >
                        Play Selected
                      </button>
                      <button className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 rounded font-bold transition" onClick={handlePlayerActionDraw}>Skip (Draw)</button>
                    </>
                  )}
                  {turnState.phase === 'end' && (
                    <button
                       className={`px-3 py-1.5 rounded font-bold transition ${player.hand.length > 7 ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                       onClick={() => {
                          if (player.hand.length > 7) {
                             if(selectedCard) {
                               handlePlayerDiscard(selectedCard);
                               setSelectedCard(null);
                             } else {
                               alert("Select a card to discard down to 7.");
                             }
                          } else {
                             handlePlayerEndPhaseReady();
                          }
                       }}
                    >
                      {player.hand.length > 7 ? 'Discard Selected' : 'End Turn'}
                    </button>
                  )}
                </div>
             )}
          </div>

          {/* Nursery */}
          <div className="h-[15vh] aspect-[5/7] bg-pink-900 rounded-md shadow-md border-2 border-pink-500 flex flex-col items-center justify-center font-bold text-xs text-pink-200">
             <div className="mb-1 text-2xl">🦄</div>
             Nursery<br/>({nursery.length})
          </div>
        </div>

        {/* BOTTOM AREA: Player's Side (50vh) */}
        <div className="h-[50vh] relative flex flex-col pb-2">

           {/* Player Field Info */}
           <div className="flex justify-between items-center text-xs text-blue-400 px-4 pt-2">
              <div className="font-bold">Player Field: {player.stable.length}/7 (Stable) {modifiers.player.unicornsAreCats && "(CATS!)"}</div>
              <div className={`font-bold ${player.hand.length > 7 ? 'text-red-500' : ''}`}>
                 Hand: {player.hand.length} {player.hand.length > 7 && "(Must Discard)"}
              </div>
           </div>

           {/* Player Field (Upgrades + Stable + Downgrades) */}
           <div className="flex-1 flex flex-col items-center justify-center gap-1 px-4 pb-[20vh]">
              {player.upgrades.length === 0 && player.stable.length === 0 && player.downgrades.length === 0 ? (
                <div className="text-xs text-gray-600 italic mt-8">Empty Field</div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 w-full">
                  {/* Upgrades Row */}
                  {player.upgrades.length > 0 && (
                    <div className="flex gap-2 h-[10vh] justify-center items-end w-full opacity-90">
                      {player.upgrades.map(c => (
                        <div key={c.instanceId} className="h-full">
                           <Card card={c} onContextMenu={setInspectCard} />
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Stable Row */}
                  <div className="flex gap-3 h-[16vh] justify-center items-center w-full">
                    {player.stable.map(c => (
                      <div key={c.instanceId} className="h-full hover:scale-105 transition-transform duration-200">
                         <Card card={c} onContextMenu={setInspectCard} />
                      </div>
                    ))}
                  </div>
                  {/* Downgrades Row */}
                  {player.downgrades.length > 0 && (
                    <div className="flex gap-2 h-[10vh] justify-center items-start w-full opacity-90 filter sepia-[.3]">
                      {player.downgrades.map(c => (
                        <div key={c.instanceId} className="h-full">
                           <Card card={c} onContextMenu={setInspectCard} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
           </div>

           {/* Player Hand (Fixed to bottom, fanned out) */}
           <div className="absolute bottom-0 left-0 w-full h-[22vh] flex justify-center items-end px-12 z-10 pointer-events-none">
              {player.hand.map((c, i) => (
                <div
                  key={c.instanceId}
                  className={`h-full pointer-events-auto transition-transform duration-200 origin-bottom hover:scale-110 hover:-translate-y-6 hover:z-50 ${i > 0 ? '-ml-10 md:-ml-12' : ''}`}
                  style={{ zIndex: i }}
                >
                  <Card
                    card={c}
                    selected={selectedCard?.instanceId === c.instanceId}
                    onClick={() => setSelectedCard(c)}
                    onContextMenu={setInspectCard}
                  />
                </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
}