import { Check, Coins, Lock, ShoppingBag } from 'lucide-react';
import { buyItem, equipItem, useShop, useUserMutation } from '../hooks/api';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar, ErrorState, PageHeader, PageSkeleton } from '../components/ui';
import { cn, fmtNumber } from '../lib/utils';
import { errorMessage } from '../lib/api';
import { FRAMES } from '../lib/cosmetics';
import type { ShopItem } from '../types';

export default function Shop() {
  const { t, tx, lang } = useSettings();
  const { user } = useAuth();
  const toast = useToast();
  const q = useShop();
  const buy = useUserMutation(buyItem);
  const equip = useUserMutation(equipItem);
  if (!user) return null;
  if (q.isLoading) return <PageSkeleton />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;

  async function act(item: ShopItem) {
    try {
      if (user!.inventory.includes(item.key)) await equip.mutateAsync(item.key);
      else {
        await buy.mutateAsync(item.key);
        toast.success(t('shop.bought'), tx(item.name));
        await equip.mutateAsync(item.key);
      }
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  const groups: ShopItem['type'][] = ['avatar', 'theme', 'frame'];
  return (
    <div>
      <PageHeader
        title={t('shop.title')}
        subtitle={t('shop.subtitle')}
        icon={ShoppingBag}
        action={
          <div className="card flex items-center gap-3 px-4 py-2">
            <Avatar equipped={user.equipped} size={44} />
            <span className="flex items-center gap-1 text-lg font-black text-amber-400">
              <Coins size={20} /> {fmtNumber(user.coins, lang)}
            </span>
          </div>
        }
      />
      {groups.map((g) => (
        <section key={g} className="mb-8" aria-labelledby={`shop-${g}`}>
          <h2 id={`shop-${g}`} className="mb-3 text-lg font-bold">
            {t(`shop.${g}`)}
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {(q.data ?? [])
              .filter((i) => i.type === g)
              .map((item) => {
                const owned = user.inventory.includes(item.key);
                const equipped = user.equipped[item.type] === item.key;
                const levelLocked = user.level.level < item.minLevel;
                const poor = !owned && user.coins < item.price;
                return (
                  <li key={item.key} className={cn('card flex flex-col items-center gap-3 p-4 text-center', equipped && 'border-primary')}>
                    <div className="grid h-20 w-20 place-items-center">
                      {item.type === 'avatar' && <Avatar equipped={{ ...user.equipped, avatar: item.key }} size={64} />}
                      {item.type === 'theme' && <span className="h-14 w-14 rounded-2xl shadow-lg" style={{ background: item.value }} />}
                      {item.type === 'frame' && <span className={cn('grid h-16 w-16 place-items-center rounded-full bg-card-2 text-2xl', FRAMES[item.key])}>🙂</span>}
                    </div>
                    <p className="font-bold">{tx(item.name)}</p>
                    {equipped ? (
                      <span className="chip border-primary/40 text-primary">
                        <Check size={13} /> {t('shop.equipped')}
                      </span>
                    ) : levelLocked ? (
                      <span className="chip">
                        <Lock size={13} /> {t('shop.needLevel', { n: item.minLevel })}
                      </span>
                    ) : (
                      <button type="button" className={owned ? 'btn-secondary btn-sm w-full' : 'btn-primary btn-sm w-full'} disabled={poor || buy.isPending || equip.isPending} onClick={() => act(item)}>
                        {owned ? (
                          t('shop.equip')
                        ) : (
                          <>
                            <Coins size={14} /> {item.price}
                          </>
                        )}
                      </button>
                    )}
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
