import {Check, CircleX, HandCoins, KeyRound, ListChecks, LogIn, Mail, Plus, Printer, RotateCw, Save, Send, Trash2, UserRound} from 'lucide-react';

// Ícono fijo de cada acción: la misma acción lleva el mismo ícono en todo el sistema
export const ACTION_ICONS = {
  cancel: CircleX,
  close: CircleX,
  save: Save,
  add: Plus,
  confirm: Check,
  remove: Trash2,
  print: Printer,
  retry: RotateCw,
  send: Send,
  ready: ListChecks,
  charge: HandCoins,
  login: LogIn,
  password: KeyRound,
  email: Mail,
  employee: UserRound,
};
