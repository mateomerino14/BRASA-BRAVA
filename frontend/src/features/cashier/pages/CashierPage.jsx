import {useSearchParams} from 'react-router';
import {useAuth} from '../../../context/useAuth';
import {FloorView} from '../components/FloorView';
import {OrderView} from '../components/OrderView';
import {useFloor} from '../hooks/useFloor';
import {useTableOrder} from '../hooks/useTableOrder';

function FloorScreen({sectionId, onSectionChange, onOpenTable}) {
  const floor = useFloor({sectionId, onSectionChange});
  return <FloorView floor={floor} onOpenTable={onOpenTable} />;
}

function OrderScreen({idMesa, onBack}) {
  const {user} = useAuth();
  const order = useTableOrder({idMesa, user});
  return <OrderView order={order} onBack={onBack} />;
}

// Caja: plano de mesas por sección y, al elegir una, el armado de su pedido; la mesa y la sección viven en la URL
export function CashierPage() {
  const [params, setParams] = useSearchParams();
  const idMesa = params.get('mesa');
  const sectionId = params.get('seccion');

  const update = (changes, options) => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      for (const [key, value] of Object.entries(changes)) {
        if (value) {
          next.set(key, value);
        }
        else {
          next.delete(key);
        }
      }
      return next;
    }, options);
  };

  if (idMesa) {
    return <OrderScreen key={idMesa} idMesa={Number(idMesa)} onBack={() => update({mesa: null})} />;
  }
  return (
    <FloorScreen
      sectionId={sectionId}
      onSectionChange={(id) => update({seccion: id}, {replace: true})}
      onOpenTable={(mesa) => update({mesa: String(mesa.id)})}
    />
  );
}
