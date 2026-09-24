const THREE = require('three');

function generateMecha(THREE, options = {}) {
  const { team = 0, isPlayer = false, number = 7 } = options;
  const g = new THREE.Group();
  console.log(`Generating mecha: team=${team}, isPlayer=${isPlayer}, number=${number}`);
  return g;
}

const m = generateMecha(THREE, { team: 0, isPlayer: true, number: 7 });
console.log('Success, group created:', !!m);
