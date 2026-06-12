import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  change?: string;
  index?: number;
}

const StatsCard = ({ title, value, icon: Icon, color, change, index = 0 }: StatsCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08, duration: 0.3 }}
    className="rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 cursor-default"
    style={{
      background: 'rgba(255,255,255,0.07)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.1)',
    }}
  >
    <div className="mb-3">
      <div className={`${color} w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
        <Icon size={19} className="text-white" />
      </div>
    </div>
    <p className="text-2xl font-bold text-white tracking-tight leading-none mb-1">{value}</p>
    <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>{title}</p>
    {change && (
      <p className="text-xs mt-1.5 truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{change}</p>
    )}
  </motion.div>
);

export default StatsCard;
