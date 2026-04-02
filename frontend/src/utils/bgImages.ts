// Random background image selector for dashboard pages
const backgroundImages = [
  '/images/570500657_1413126164152571_5274034176323734586_n.jpg',
  '/images/571126754_1413126147485906_1060138877207980483_n.jpg',
  '/images/571186297_1413126160819238_5117548656659110389_n.jpg',
  '/images/571263497_1413126167485904_994699021090291885_n.jpg',
  '/images/584810246_1432706242194563_8040677308497068650_n.jpg',
  '/images/586585170_1436726595125861_7303848134642207578_n.jpg',
  '/images/594782001_1452102253588295_8341594361948780813_n.jpg',
  '/images/596429882_1452102453588275_6114329755014752314_n.jpg',
  '/images/597073474_1452102706921583_2943199249772390092_n.jpg',
  '/images/628865399_1510005134464673_8943539234288945065_n.jpg',
  '/images/632577842_1510005137798006_4335844479685126682_n.jpg',
  '/images/633277690_1510005141131339_7372002966840803516_n.jpg',
  '/images/634186242_1510005127798007_300752410045900235_n.jpg',
  '/images/dashboard-bg.jpg',
];

export function getRandomBackgroundImage(): string {
  const randomIndex = Math.floor(Math.random() * backgroundImages.length);
  return backgroundImages[randomIndex];
}

export function getRandomBackgroundImageFromList(list: string[]): string {
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}
