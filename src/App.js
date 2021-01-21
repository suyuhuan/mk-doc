import { useState,useEffect} from 'react'
import FileSearch from './components/FileSearch'
import FileList from './components/FileList'
import BottomBtn from './components/BottomBtn'
import TabList from './components/TabList'
import Loader from './components/Loader'
import SimpleMDE from 'react-simplemde-editor'
import defaultFiles from './utils/defaultFiles'
import { v4 as uuidv4 } from 'uuid'
import {flattenArr,objToArr,timestampToString} from './utils/helper'
import fileHelper from './utils/fileHelper'
import useIpcRenderer from './hooks/useIpcRenderer'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'easymde/dist/easymde.min.css'
import { faLess } from '@fortawesome/free-brands-svg-icons'
import { faPlus, faFileImport, faSave} from '@fortawesome/free-solid-svg-icons'
import './App.css';

//require node modules
const { join, basename, extname, dirname} = window.require('path')
const { remote, ipcRenderer } = window.require('electron')
const Stroe = window.require('electron-store')

//设置本地存储
const fileStore = new Stroe({'name':'Files Data'})
const settingsStore = new Stroe({'name':'Settings'})

const getAutoSync = () => ['accessKey', 'secretKey', 'bucketName','enableAutoSync'].every(key => !!settingsStore.get(key))

const saveFilesToStore = (files) => {
  const fileStoreObj = objToArr(files).reduce((result,file)=>{
    const { id, path, title, createdAt, isSynced, updatedAt } = file
    result[id] = {
      id,
      path,
      title,
      createdAt,
      isSynced,
      updatedAt
    }
    return result
  },{})
  fileStore.set('files',fileStoreObj)
}

function App() {
  // const [ files, setFiles ] = useState(flattenArr(defaultFiles))
  const [files, setFiles] = useState(fileStore.get('files') || {})
  const [ activeFileID, setActiveFileID ] = useState('')
  const [ openedFileIDs, setOpenedFileIDs ] = useState([])
  const [ unsavedFileIDs, setUnsavedFileIDs ] = useState([])
  const [ searchedFiles, setSearchedFiles ] = useState([])
  const [isLoading, setLoading]  = useState(false)

  const filesArr = objToArr(files)
  //保存位置
  const savedLocation = settingsStore.get('savedFileLocation') || remote.app.getPath('documents')

   //修改前
  // const openedFiles = openedFileIDs.map(openID => {
  //   return files.find(file => file.id === openID)
  // })

  // 修改后
  const openedFiles = openedFileIDs.map(openID => {
    return files[openID]
  })

  const fileClick = (fileID) => {
    //set current active file
    // 查看文档
    setActiveFileID(fileID)
    const currentFile = files[fileID]
    const {id, title, path, isLoaded} = currentFile
    if (!isLoaded) {
     
      if(getAutoSync()) {
        ipcRenderer.send('download-file',{key:`${title}.md`, path, id})
      } else {
        fileHelper.readFile(currentFile.path).then(value => {
          const newFile = {...files[fileID], body:value, isLoaded:true}
          setFiles({...files,[fileID]:newFile})
        })
      }
    }
    // if opendeFiles don't have the current ID
    if (!openedFileIDs.includes(fileID)){
    // add new fileId to openedFiles
        setOpenedFileIDs([...openedFileIDs,fileID])
      }
  }

  const tabClick = (fileID) => {
    //set current active file
    setActiveFileID(fileID)
  }

  const tabClose = (id) => {
    // remove current id from openedFileIDs
    const tabsWithout = openedFileIDs.filter(fileID => fileID !== id)
    setOpenedFileIDs(tabsWithout)
    //set the active to the first opened tab if still tabs left
    if (tabsWithout.length > 0) {
      setActiveFileID(tabsWithout[0])
    } else {
      setActiveFileID('')
    }
    
  }

  const fileChange = (id,value) => {
    if (value !== files[id].body) {
      const newFile = {...files[id],body:value} 
      setFiles({...files, [id]: newFile}) 
      if (!unsavedFileIDs.includes(id)) {
        setUnsavedFileIDs([...unsavedFileIDs, id])
      }
    }
    //修改前
    // const newFiles = files.map(file => {
    //   if (file.id === id) {
    //     file.body = value
    //   }
    //   return file
    // })

    // 修改后
    // const newFile = {...files[id],body:value}

    // 修改前
    // setFiles(newFiles)
    //修改后
    // setFiles({...files, [id]: newFile})

    //update unsaveIds
    // if (!unsaveFileIDs.includes(id)) {
    //   setUnsavedFileIDs([...unsaveFileIDs, id])
    // }
  }
    const deleteFile = (id) => {
    if (files[id].isNew) {
      const { [id]: value, ...afterDelete } = files
      setFiles(afterDelete)
    } else {
      fileHelper.deleteFile(files[id].path).then(() => {
        const { [id]: value, ...afterDelete } = files
        setFiles(afterDelete)
        saveFilesToStore(afterDelete)
        // close the tab if opened
        tabClose(id)
      })
    }
  }
  const updateFileName = (id, title,isNew) => {

    // newPath should be different based on isNew
    // if isNew is false, path should be old dirnam + new title
    const newPath = isNew ? join(savedLocation,`${title}.md`) : join(dirname(files[id].path), `${title}.md`)

    const modifiedFile = {...files[id], title, isNew:false, path:newPath}
    const newFiles = {...files,[id]:modifiedFile}
     
    if (isNew) {
      fileHelper.writeFile(newPath, files[id].body).then(()=>{
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    } else {
      // const oldPath = join(savedLocation,`${files[id].title}.md`)
      const oldPath = files[id].path
      fileHelper.renameFile(oldPath, newPath).then(()=>{
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    }

    //修改前
    // setFiles(newFiles)
    //修改后
    // setFiles({...files, [id]: modifiedFile})
  }

  const fileSearch = (keyword) => {
    // const newFiles = files.filter(file => file.title.includes(keyword))
    const newFiles = filesArr.filter(file => file.title.includes(keyword)) 
    setSearchedFiles(newFiles)
  }

  const createNewFile = () => {
    const newID = uuidv4()
    const newFile = {
      id: newID,
      title: '',
      body: '## 请输出 Markdown',
      createdAt: new Date().getTime(),
      isNew: true,
    }
    setFiles({ ...files, [newID]: newFile })
  }

  //修改前
  // const activeFile = files.find(file => file.id === activeFileID)
  const activeFile = files[activeFileID]
 
  // const fileListArr = (searchedFiles.length > 0) ? searchedFiles : files
  const fileListArr = (searchedFiles.length > 0) ? searchedFiles : filesArr

  const saveCurrentFile = () => {
    const { path, body, title } = activeFile
    fileHelper.writeFile(path, body).then(() => {
      setUnsavedFileIDs(unsavedFileIDs.filter(id => id !== activeFile.id))
      if (getAutoSync()) {
        ipcRenderer.send('upload-file', {key: `${title}.md`, path })
      }
    })
  }


  //文件导入
  const importFiles = () => {
    remote.dialog.showOpenDialog({
      title:'选择导入的 markdown 文件',
      properties:['openFile', 'multiSelections'],
      filters:[
        {name: 'Markdown files', extensions:['md']}
      ]
    }).then(result =>{
      let paths = result.filePaths;
      if (Array.isArray(paths)) {
        //filter out the path we already have in electron store
        //去重
        const filteredPaths = paths.filter(path => {
          const alreadyAdded = Object.values(files).find(file => {
            return file.path === path
          })
          return !alreadyAdded
        })
       
        //extend the path array to an array contains files info
        const importFilesArr = filteredPaths.map(path => {
          return {
            id: uuidv4(),
            title: basename(path, extname(path)),
            path,
          }
        })
        
        //get the new files object in flattenarr
        const newFiles  = {...files, ...flattenArr(importFilesArr)}
      
        setFiles(newFiles)
        saveFilesToStore(newFiles)
        
        if (importFilesArr.length > 0) {
          remote.dialog.showMessageBox({
            type:'info',
            title:`成功导入了${importFilesArr.length}个文件`,
            message:`成功导入了${importFilesArr.length}个文件`
          })
        }

        //setstate and update electron store
      }
    }).catch(err => {
      console.log(err)
    })
  }
  const activeFileUploaded = () => {
    const { id } = activeFile
    const modifiedFile = { ...files[id], isSynced: true, updatedAt: new Date().getTime() }
    const newFiles = { ...files, [id]: modifiedFile }
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }

  const activeFileDownloaded = (event, message) => {
    const currentFile = files[message.id]
    const { id, path } = currentFile
    fileHelper.readFile(path).then(value => {
      let newFile
      if (message.status === 'download-success') {
        newFile = { ...files[id], body: value, isLoaded: true, isSynced: true, updatedAt: new Date().getTime() }
      } else {
        newFile = { ...files[id], body: value, isLoaded: true}
      }
      const newFiles = { ...files, [id]: newFile }
      setFiles(newFiles)
      saveFilesToStore(newFiles)
    })
  }
  const filesUploaded = () => {
    const newFiles = objToArr(files).reduce((result, file) => {
      const currentTime = new Date().getTime()
      result[file.id] = {
        ...files[file.id],
        isSynced: true,
        updatedAt: currentTime,
      }
      return result
    }, {})
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }
  //原生菜单栏
 useIpcRenderer({
   'create-new-file':createNewFile,
   'import-file': importFiles,
   'save-edit-file': saveCurrentFile,
   'active-file-uploaded':activeFileUploaded,//更新到云
   'file-downloaded': activeFileDownloaded,
   'files-uploaded': filesUploaded,
   'loading-status': (message, status) => { setLoading(status) }
 })
  return (
    <div className="App container-fluid px-0">
      {isLoading && 
          <Loader/>
      }
      <div className="row no-gutters">
        <div className="col-3 left-panel">
          <FileSearch title='我的云文档' 
          onFileSearch={fileSearch} />

          <FileList
             files={fileListArr}
             onFileClick={fileClick}
             onFileDelete={deleteFile}
             onSaveEdit={updateFileName}
           />

           <div className="row no-gutters button-group">
             <div className="col-6">
               <BottomBtn 
                  text="新建"
                  colorClass="btn-primary"
                  icon={faPlus}
                  onBtnClick={createNewFile}
               />
             </div>
             <div className="col-6">
               <BottomBtn
                   text="导入"
                   colorClass="btn-success"
                   icon={faFileImport}
                   onBtnClick={importFiles}
                />
             </div>
           </div>
        </div>
        <div className="col-9 right-panel">
          { !activeFile && 
             <div className="start-page">
               选择或创建新的 Markdown 文档
             </div>
          }
          { activeFile && 
            <>
              <TabList 
                files={openedFiles}
                activeId={activeFileID}
                unsaveIds={unsavedFileIDs}
                onTabClick={tabClick}
                onCloseTab={tabClose}
              />
              <SimpleMDE 
              key={activeFile && activeFile.id}
              value={activeFile && activeFile.body} 
              onChange={(value)=>{fileChange(activeFile.id,value)}}
              options={{
                  minHeight: '515px',
                }}
              />
              { activeFile.isSynced &&
               <span className="sync-status">
                 已同步，上次同步{timestampToString(activeFile.updatedAt)}
               </span>
              }
               {/* <BottomBtn
                   text="保存"
                   colorClass="btn-success button-group"
                   icon={faSave}
                   onBtnClick={saveCurrentFile}
                /> */}
             </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
