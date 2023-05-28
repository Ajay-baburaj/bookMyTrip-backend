const { v4: uuidv4 } = require('uuid');

module.exports.generateUniqueRandomNumber=()=> {
  const uuid = uuidv4();
  const random_number = uuid.substr(0, 6).replace(/-/g, '');
    return random_number;
}


