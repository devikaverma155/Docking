import React, { useCallback, useEffect, useState } from 'react';
import Quill from 'quill';
import "quill/dist/quill.snow.css";
import { socket } from './socket';
import { useParams } from 'react-router';

const toolbarOptions = [
  ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
  ['blockquote', 'code-block'],
  ['link', 'image', 'video', 'formula'],
  [{ 'header': 1 }, { 'header': 2 }],               // custom button values
  [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
  [{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
  [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
  [{ 'direction': 'rtl' }],                         // text direction
  [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
  [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
  [{ 'font': [] }],
  [{ 'align': [] }],
  ['clean']                                         // remove formatting button
];

export default function TextEditor() {
  const [quill, setQuill] = useState();
  const { id } = useParams();

  useEffect(() => {
    if (quill == null) return;

    const handleFunction = (delta, oldDelta, source) => {
      if (source !== 'user') return;
      socket.emit('send-changes', delta);
      console.log(delta);
    };

    quill.on('text-change', handleFunction);

    return () => {
      quill.off('text-change', handleFunction);
    };
  }, [quill]);

  useEffect(() => {
    if (quill === null) return;

    const handleReceiveChanges = (delta) => {
      quill.updateContents(delta);
    };

    socket.on('receieve-changes', handleReceiveChanges);

    return () => {
      socket.off('receieve-changes', handleReceiveChanges);
    };
  }, [quill]);

  useEffect(() => {
    if (quill === null) return;

    socket.once('load-document', document => {
      quill.setContents(document);
      quill.enable();
    });

    socket.emit('get-document', id);
  }, [quill, id]);

  useEffect(() => {
    if (quill === null) return;

    const saveInterval = setInterval(() => {
      socket.emit('save-document', quill.getContents());
    }, 1000);

    return () => {
      clearInterval(saveInterval);
    };
  }, [quill]);

  const wrapperRef = useCallback(wrapper => {
    if (wrapper == null) return;

    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: toolbarOptions },
    });
    q.disable();
    q.setText("loading the document");
    setQuill(q);
  }, []);

  return (
    <div className='container' ref={wrapperRef}></div>
  );
}
