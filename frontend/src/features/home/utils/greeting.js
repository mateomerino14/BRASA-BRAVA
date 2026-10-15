const MORNING_FROM = 5;
const AFTERNOON_FROM = 12;
const NIGHT_FROM = 19;

// Saludo según la hora del día, sin género: "Buenos días, Marco"
export const greetingFor = (name, date) => {
  const hour = date.getHours();
  let greeting = 'Buenas noches';
  if (hour >= MORNING_FROM && hour < AFTERNOON_FROM) {
    greeting = 'Buenos días';
  }
  else if (hour >= AFTERNOON_FROM && hour < NIGHT_FROM) {
    greeting = 'Buenas tardes';
  }
  const firstName = name?.split(' ')[0];
  if (firstName) {
    return `${greeting}, ${firstName}`;
  }
  return greeting;
};
