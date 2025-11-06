// import moment from 'moment';
import moment from "moment-timezone";
import 'moment/locale/cs';

moment.locale('cs');
moment.tz.setDefault('Europe/Prague');

export default moment;
