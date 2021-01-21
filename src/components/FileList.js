import React, { useState,useEffect,useRef} from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes, faTrash,faEdit } from '@fortawesome/free-solid-svg-icons'
import { faMarkdown } from '@fortawesome/free-brands-svg-icons'
import PropTypes from 'prop-types';
import useKeyPress from '../hooks/useKeyPress'
import useContextMenu from '../hooks/useContextMenu'
import { getParentNode } from '../utils/helper'
//load nodejs modules
const {remote} = window.require('electron')
const {Menu, MenuItem}  = remote


const FileList  = ({files, onFileClick,onSaveEdit,onFileDelete}) => {
    const [editStatus, setEditStatus] = useState(false)
    const [value, setValue] = useState('')
    let node = useRef(null)

    const enterPressed = useKeyPress(13)
    const escPressed = useKeyPress(27)

    const closeSearch = (editItem) => {
        setEditStatus(false);
        setValue('');

        if (editItem.isNew) {
            onFileDelete(editItem.id)
        }
    }
    const clickedItem = useContextMenu([
        {
            label:'打开',
            click: () => {
                const parentElement = getParentNode(clickedItem.current,'file-item',[files])
                if (parentElement) {
                    onFileClick(parentElement.dataset.id)
                }
            }
        },
        {
            label:'重命名',
            click: () => {
                const parentElement = getParentNode(clickedItem.current,'file-item',[files])
                if (parentElement) {
                    setEditStatus(parentElement.dataset.id)
                    setValue(parentElement.dataset.title)
                }
            }
        },
        {
            label:'删除',
            click: () => {
                const parentElement = getParentNode(clickedItem.current,'file-item',[files])
                if (parentElement) {
                    onFileDelete(parentElement.dataset.id)
                }
            }
        }
    ],'.file-list')
    
    useEffect(() => {
        const editItem = files.find(file=> file.id === editStatus)
        if (enterPressed && editStatus && value.trim() !== '') {
            onSaveEdit(editItem.id,value,editItem.isNew)
            setEditStatus(false)
            setValue('')
        }
        if (escPressed && editStatus) {
            closeSearch(editItem);
        }

        // const handleInputEvent = (event) => {
        //     const { keyCode } = event;
        //     if (keyCode === 13 && editStatus) {
        //         const editItem = files.find(file=> file.id === editStatus)
        //         onSaveEdit(editItem.id,value)
        //         setEditStatus(false)
        //         setValue('')
        //     } else if (keyCode === 27 && editStatus) {
        //         closeSearch(event);
        //     }
        // };
        // document.addEventListener('keyup', handleInputEvent);
        // return () => {
        //     document.removeEventListener('keyup', handleInputEvent);
        // };
    })
    
    useEffect(()=>{
        const newFile = files.find(file => file.isNew)
        // console.log(newFile)
        if (newFile) {
            setEditStatus(newFile.id)
            setValue(newFile.title)
        }
    },[files])

    useEffect(()=> {
        if (editStatus) {
            node.current.focus()
        }
    },[editStatus])
    return (
        <ul className="list-group list-group-flush file-list">
            {
                files.map(file => (
                    <li
                      className="row list-group-item bg-light d-flex align-items-center file-item mx-0"
                      key={file.id}
                      data-id = {file.id}
                      data-title = {file.title}
                    >
                     {((file.id !== editStatus) && !file.isNew) &&
                     <>
                        <span className="col-2">
                            <FontAwesomeIcon icon={faMarkdown}/>
                        </span>
                        <span 
                        className="col-6 c-link"
                        onClick={()=>{onFileClick(file.id)}}
                        >{file.title}</span>
                        <button
                                type="button"
                                className="icon-button col-1"
                                 onClick={()=>{setEditStatus(file.id);setValue(file.title)}}
                            >
                                <FontAwesomeIcon title="编辑" icon={faEdit} />
                        </button>
                        <button
                                type="button"
                                className="icon-button col-1"
                                onClick={()=>{onFileDelete(file.id)}}
                            >
                                <FontAwesomeIcon title="删除" icon={faTrash} />
                        </button>
                        </>
                        }
                        {((file.id === editStatus) || file.isNew)&& 
                            <>
                                <input
                                    className="form-control col-10"
                                    value={value}
                                    ref = {node}
                                    placeholder='请输入文档名称'
                                    onChange={(e) => { setValue(e.target.value); } } />
                                <button
                                    type="button"
                                    className="icon-button col-2"
                                    onClick={()=>{closeSearch(file)}}
                                >
                                    <FontAwesomeIcon title="关闭" icon={faTimes} />
                                </button>
                            </>
                        }
                    </li>
                ))
            }
        </ul>
    )
}
FileList.protoTypes = {
    files: PropTypes.array,
    onFileClick: PropTypes.func,
    onFileDelete: PropTypes.func,
    onSaveEdit:PropTypes.func
}
export default FileList