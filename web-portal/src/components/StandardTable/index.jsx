import React, { Component } from 'react';
import {
    Table,
    Button,
    Input,
    Icon,
} from 'antd';
import {formatMessage } from 'umi/locale';
import Highlighter from 'react-highlight-words';
import styles from './index.less';

class StandardTable extends Component{

    constructor(props) {
        super(props);

        this.columnDic = {};
        this.columns=[];
        for(let column of this.props.columns)
        {
            if(column.search === true){
                let newColumn = {...column,...this.getColumnSearchProps(column.dataIndex,column.title,column.onSearch)};
                this.columns.push(newColumn);
                this.columnDic[newColumn.dataIndex] = newColumn;
            }else{
                this.columns.push(column);
                this.columnDic[column.dataIndex] = column;
            }
        }
    }


    state = {
        searchTextObj: {},
    };

    getColumnSearchProps = (columnDataKey,title,onSearch) => ({
        filterDropdown: ({
                             setSelectedKeys, selectedKeys, confirm, clearFilters,
                         }) => (
            <div className={styles["custom-filter-dropdown"]}>
                <Input
                    ref={node => { this.searchInput = node; }}
                    placeholder={`${formatMessage({id:'standardTable.searchPlaceHolder'})} ${title}`}
                    value={selectedKeys[0]}
                    onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => this.handleSearch(columnDataKey,selectedKeys, confirm,onSearch)}
                    style={{ width: 188, marginBottom: 8, display: 'block' }}
                />
                <Button
                    type="primary"
                    onClick={() => this.handleSearch(columnDataKey,selectedKeys, confirm, onSearch)}
                    icon="search"
                    size="small"
                    style={{ width: 90, marginRight: 8 }}
                >
                    {formatMessage({id:'standardTable.btn.search'})}
                </Button>
                <Button
                    onClick={() => this.handleReset(columnDataKey,selectedKeys,clearFilters)}
                    size="small"
                    style={{ width: 90 }}
                >
                    {formatMessage({id:'standardTable.btn.reset'})}
                </Button>
            </div>
        ),
        filterIcon: filtered => <Icon type="search" style={{ color: filtered ? '#1890ff' : undefined }} />,
        onFilter: (value, record) => {

            let columnData = record[columnDataKey]?record[columnDataKey]:'';

            let columnDef = this.columnDic[columnDataKey];

            if(columnDef.isObjectArray)
            {
                let isFound=false;
                for(let dataObj of columnData)
                {
                    //console.log("Search",dataObj.name,dataObj,value,dataObj.name.toString().toLowerCase().includes(value.toLowerCase()));
                    isFound = dataObj.name.toString().toLowerCase().includes(value.toLowerCase());

                    if(isFound)
                    {
                        break;
                    }
                }

                return isFound;

            }else{
                return columnData.toString().toLowerCase().includes(value.toLowerCase())
            }
        },
        onFilterDropdownVisibleChange: (visible) => {
            if (visible) {
                setTimeout(() => this.searchInput.select());
            }
        },
        render:(columnData,record) => {

            let columnDataIndex = '';
            for(let key in record){
                if(record[key] === columnData){
                    if (this.columnDic[key]){
                        columnDataIndex = key;
                        break;
                    }
                }
            }

            let column = this.columnDic[columnDataIndex];
            let RenderParent = column.searchColumnRender;

            if(column.isStringArray){

                //console.log("RenderStringArray",columnData,record);

                let renderDomArray = columnData.map((itemContent,index)=>{

                    return (
                        <RenderParent key={index.toString()} record={itemContent}>
                            <Highlighter
                                highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                                searchWords={Object.keys(this.state.searchTextObj).map(columnKey=>this.state.searchTextObj[columnKey])}
                                autoEscape
                                textToHighlight={itemContent?itemContent.toString():''}
                            />
                        </RenderParent>
                    );
                });

                return renderDomArray;

            }if(column.isObjectArray){

                let renderDomArray = columnData.map((object,index)=>{
                    //约定object一定要有name属性，作为显示名字
                    return (
                        <RenderParent key={index.toString()} record={object}>
                            <Highlighter
                                highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                                searchWords={Object.keys(this.state.searchTextObj).map(columnKey=>this.state.searchTextObj[columnKey])}
                                autoEscape
                                textToHighlight={object.name?object.name.toString():''}
                            />
                        </RenderParent>
                    );
                });

                return renderDomArray;

            }else if(RenderParent) {
                return (
                    <RenderParent record={record}>
                        <Highlighter
                        highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                        searchWords={Object.keys(this.state.searchTextObj).map(columnKey=>this.state.searchTextObj[columnKey])}
                        autoEscape
                        textToHighlight={columnData?columnData.toString():''}
                        />
                    </RenderParent>
                )
            }else{

                return (
                    <Highlighter
                    highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                    searchWords={Object.keys(this.state.searchTextObj).map(columnKey=>this.state.searchTextObj[columnKey])}
                    autoEscape
                    textToHighlight={columnData?columnData.toString():''}
                    />
                );
            }
        }
    })

    handleSearch = (columnDataKey,selectedKeys, confirm,onSearch) => {
        onSearch && onSearch();

        confirm();

        let searchObj = JSON.parse(JSON.stringify(this.state.searchTextObj));

        searchObj[columnDataKey] = selectedKeys[0];

        this.setState({ searchTextObj: searchObj });
    }

    handleReset = (columnDataKey,selectedKeys,clearFilters) => {
        clearFilters();

        let searchObj = JSON.parse(JSON.stringify(this.state.searchTextObj));

        delete searchObj[columnDataKey];

        this.setState({ searchTextObj: searchObj });
    }

    render(){
        return (
            <Table
                columns={this.columns}
                dataSource={this.props.dataSource}
                loading={this.props.loading}
                pagination={this.props.pagination}
                onChange={this.props.onChange}
                size="middle"
            />
        );
    }
}

export default StandardTable;
