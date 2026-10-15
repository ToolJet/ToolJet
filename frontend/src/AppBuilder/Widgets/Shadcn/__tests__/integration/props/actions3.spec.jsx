import useStore from '@/AppBuilder/_stores/store'; // eslint-disable-line no-unused-vars -- marks this a real-store (integration) spec
import { actionsShard } from './actionsSuite';

actionsShard(3, 6);
