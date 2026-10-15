import { motion } from 'framer-motion';

export function SectionHeader({ label, title, action, to, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.25 }}
      className="mb-4 flex items-end justify-between gap-4 border-b border-line pb-2"
    >
      <div className="flex items-center gap-2.5">
        {Icon && <Icon size={15} className="text-accent" />}
        <div>
          {label && (
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">{label}</p>
          )}
          <h2 className="text-base font-bold uppercase tracking-wide text-zinc-100 sm:text-lg">
            {title}
          </h2>
        </div>
      </div>
      {action}
    </motion.div>
  );
}
