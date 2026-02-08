import DirectionCard from "@/components/shared/DirectionCard";

const directionsData = [
  {
    name: "Робототехника",
    age: "7+",
    description: "Спроектируйте и соберите собственного подвижного робота, освоив основы схемотехники и программирования на Arduino.",
    days: ["ПН", "ВТ"],
    extraDays: 2,
  },
  {
    name: "Рисование",
    age: "6+",
    description: "Освойте основы композиции и поработайте с акварелью в лёгкой, воздушной технике. Урок подойдёт как для начинающих.",
    days: ["ПН", "СР", "ПТ"],
  },
  {
    name: "Театр",
    age: "1+",
    description: "Развивайте актёрские навыки, пластику и уверенность на сцене через игровые упражнения и постановки.",
    days: ["ВТ", "ЧТ"],
  },
  {
    name: "Шахматы",
    age: "4+",
    description: "Научитесь стратегически мыслить и планировать ходы. Подходит для всех уровней подготовки.",
    days: ["СР", "ПТ"],
  },
  {
    name: "Пластилинография",
    age: "3+",
    description: "Развивайте мелкую моторику и творческое мышление через работу с пластилином и другими материалами.",
    days: ["ПН", "СР"],
    extraDays: 1,
  },
  {
    name: "Программирование",
    age: "7+",
    description: "Изучайте основы программирования через создание игр и интерактивных проектов на Scratch и Python.",
    days: ["ВТ", "ЧТ"],
  },
  {
    name: "Музыка",
    age: "3+",
    description: "Вокал, ритмика и знакомство с музыкальными инструментами. Развиваем слух и чувство ритма.",
    days: ["ПН", "ПТ"],
  },
];

const DirectionsPage = () => {
  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-primary-opacity">Направления</h1>
      <div className="space-y-3">
        {directionsData.map((dir, idx) => (
          <DirectionCard key={idx} {...dir} />
        ))}
      </div>
    </div>
  );
};

export default DirectionsPage;
