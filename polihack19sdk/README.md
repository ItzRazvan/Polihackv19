# react-native-polihack19sdk

an sdk for crowdsourced weather prediction

## Installation


```sh
npm install react-native-polihack19sdk
```


## Usage


```js
import { SensorSDK } from 'react-native-polihack19sdk';

// ...

const sdk = new SensorSDK();
await sdk.initialize({ apiUrl: 'https://api.example.com/data' });
await sdk.start();
```


## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
