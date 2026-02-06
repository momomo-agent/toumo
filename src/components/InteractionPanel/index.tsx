import React, { useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import type { Interaction, GestureType, InteractionActionType, Keyframe } from '../../types';
import { Plus, Trash2, Copy, Zap, Hand, ChevronDown, ChevronRight } from 'lucide-react';

const GESTURE_OPTIONS: { value: GestureType; label: string; icon: string }[] = [
  { value: 'tap', label: '点击', icon: '👆' },
  { value: 'doubleTap', label: '双击', icon: '👆👆' },
  { value: 'longPress', label: '长按', icon: '✋' },
  { value: 'swipe', label: '滑动', icon: '👉' },
  { value: 'pan', label: '拖拽', icon: '🤏' },
  { value: 'hover', label: '悬停', icon: '🖱️' },
];

const ACTION_OPTIONS: { value: InteractionActionType; label: string }[] = [
  { value: 'goToState', label: '切换状态' },
  { value: 'toggleState', label: '状态切换' },
  { value: 'setVariable', label: '设置变量' },
  { value: 'haptic', label: '触觉反馈' },
  { value: 'openUrl', label: '打开链接' },
];

export const InteractionPanel: React.FC = () => {
  const { 
    selectedElementId, 
    interactions,
    keyframes,
    addInteraction,
    updateInteraction,
    deleteInteraction,
    duplicateInteraction,
  } = useEditorStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const elementInteractions = interactions.filter(
    i => i.elementId === selectedElementId
  );

  const handleAddInteraction = () => {
    if (!selectedElementId) return;
    
    const newInteraction: Interaction = {
      id: `interaction-${Date.now()}`,
      elementId: selectedElementId,
      gesture: { type: 'tap' },
      actions: [],
      enabled: true,
    };
    
    addInteraction(newInteraction);
    setExpandedId(newInteraction.id);
  };

  if (!selectedElementId) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        选择一个元素来添加交互
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
          <Zap size={14} />
          交互
        </h3>
        <button
          onClick={handleAddInteraction}
          className="p-1.5 rounded bg-blue-500/20 hover:bg-blue-500/30 
                     text-blue-400 transition-colors"
          title="添加交互"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Interaction List */}
      {elementInteractions.length === 0 ? (
        <div className="text-center py-6 text-gray-500 text-xs">
          <Hand size={24} className="mx-auto mb-2 opacity-50" />
          <p>暂无交互</p>
          <p className="mt-1">点击 + 添加手势交互</p>
        </div>
      ) : (
        <div className="space-y-2">
          {elementInteractions.map(interaction => (
            <InteractionItem
              key={interaction.id}
              interaction={interaction}
              expanded={expandedId === interaction.id}
              onToggle={() => setExpandedId(
                expandedId === interaction.id ? null : interaction.id
              )}
              onUpdate={(updates) => updateInteraction(interaction.id, updates)}
              onDelete={() => deleteInteraction(interaction.id)}
              onDuplicate={() => duplicateInteraction(interaction.id)}
              keyframes={keyframes}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 单个交互项组件
interface InteractionItemProps {
  interaction: Interaction;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<Interaction>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  keyframes: Keyframe[];
}

const InteractionItem: React.FC<InteractionItemProps> = ({
  interaction,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
  onDuplicate,
  keyframes,
}) => {
  const gestureOption = GESTURE_OPTIONS.find(
    g => g.value === interaction.gesture.type
  );

  return (
    <div className="bg-gray-800/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-700/30"
        onClick={onToggle}
      >
        {expanded ? (
          <ChevronDown size={14} className="text-gray-400" />
        ) : (
          <ChevronRight size={14} className="text-gray-400" />
        )}
        
        <span className="text-lg">{gestureOption?.icon || '👆'}</span>
        <span className="text-sm text-gray-300 flex-1">
          {gestureOption?.label || '点击'}
        </span>
        
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="p-1 rounded hover:bg-gray-600/50 text-gray-400"
          >
            <Copy size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-3 pt-0 space-y-3 border-t border-gray-700/50">
          {/* Gesture Select */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">手势</label>
            <select
              value={interaction.gesture.type}
              onChange={(e) => onUpdate({
                gesture: { ...interaction.gesture, type: e.target.value as GestureType }
              })}
              className="w-full bg-gray-700/50 border border-gray-600 rounded px-2 py-1.5
                         text-sm text-gray-200 focus:outline-none focus:border-blue-500"
            >
              {GESTURE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.icon} {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-500">动作</label>
              <button
                onClick={() => {
                  const newAction = {
                    id: `action-${Date.now()}`,
                    type: 'goToState' as InteractionActionType,
                  };
                  onUpdate({
                    actions: [...interaction.actions, newAction]
                  });
                }}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                + 添加动作
              </button>
            </div>

            {interaction.actions.length === 0 ? (
              <div className="text-xs text-gray-500 text-center py-2">
                暂无动作
              </div>
            ) : (
              <div className="space-y-2">
                {interaction.actions.map((action, idx) => (
                  <ActionItem
                    key={action.id}
                    action={action}
                    keyframes={keyframes}
                    onUpdate={(updates) => {
                      const newActions = [...interaction.actions];
                      newActions[idx] = { ...action, ...updates };
                      onUpdate({ actions: newActions });
                    }}
                    onDelete={() => {
                      onUpdate({
                        actions: interaction.actions.filter(a => a.id !== action.id)
                      });
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// 动作项组件
interface ActionItemProps {
  action: { id: string; type: InteractionActionType; [key: string]: any };
  keyframes: Keyframe[];
  onUpdate: (updates: any) => void;
  onDelete: () => void;
}

const ActionItem: React.FC<ActionItemProps> = ({
  action,
  keyframes,
  onUpdate,
  onDelete,
}) => {
  return (
    <div className="bg-gray-700/30 rounded p-2 space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={action.type}
          onChange={(e) => onUpdate({ type: e.target.value })}
          className="flex-1 bg-gray-600/50 border border-gray-500 rounded 
                     px-2 py-1 text-xs text-gray-200"
        >
          {ACTION_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          onClick={onDelete}
          className="p-1 rounded hover:bg-red-500/20 text-gray-400"
        >
          <Trash2 size={10} />
        </button>
      </div>

      {/* 状态切换配置 */}
      {action.type === 'goToState' && (
        <select
          value={action.targetStateId || ''}
          onChange={(e) => onUpdate({ targetStateId: e.target.value })}
          className="w-full bg-gray-600/50 border border-gray-500 rounded 
                     px-2 py-1 text-xs text-gray-200"
        >
          <option value="">选择目标状态</option>
          {keyframes.map(kf => (
            <option key={kf.id} value={kf.id}>{kf.name}</option>
          ))}
        </select>
      )}

      {/* 触觉反馈配置 */}
      {action.type === 'haptic' && (
        <select
          value={action.hapticType || 'light'}
          onChange={(e) => onUpdate({ hapticType: e.target.value })}
          className="w-full bg-gray-600/50 border border-gray-500 rounded 
                     px-2 py-1 text-xs text-gray-200"
        >
          <option value="light">轻触</option>
          <option value="medium">中等</option>
          <option value="heavy">重击</option>
          <option value="success">成功</option>
          <option value="error">错误</option>
        </select>
      )}

      {/* URL 配置 */}
      {action.type === 'openUrl' && (
        <input
          type="text"
          value={action.url || ''}
          onChange={(e) => onUpdate({ url: e.target.value })}
          placeholder="https://..."
          className="w-full bg-gray-600/50 border border-gray-500 rounded 
                     px-2 py-1 text-xs text-gray-200"
        />
      )}
    </div>
  );
};
