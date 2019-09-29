import { formatMessage } from 'umi/locale';
import Link from 'umi/link';
import Exception from '@/components/Exception';
import DocumentTitle from "react-document-title";

const Exception403 = () => (
    <DocumentTitle title={formatMessage({id:'platformName'})}>
      <Exception
        type="403"
        desc={formatMessage({ id: 'app.exception.description.403' })}
        linkElement={Link}
        backText={formatMessage({ id: 'app.exception.back.403' })}
        redirect={"/openi/user/login"}
      />
    </DocumentTitle>
);

export default Exception403;
