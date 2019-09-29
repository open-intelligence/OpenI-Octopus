import { formatMessage } from 'umi/locale';
import Link from 'umi/link';
import Exception from '@/components/Exception';
import DocumentTitle from "react-document-title";

const Exception500 = () => (

    <DocumentTitle title={formatMessage({id:'platformName'})}>
      <Exception
        type="500"
        desc={formatMessage({ id: 'app.exception.description.500' })}
        linkElement={Link}
        backText={formatMessage({ id: 'app.exception.back' })}
      />
    </DocumentTitle>
);

export default Exception500;
