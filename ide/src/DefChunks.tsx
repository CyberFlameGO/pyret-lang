/* The container that chunks live in. Handles setting up and reordering chunks.
   Most of the interesting UI considerations about the chunk editor happens in
   DefChunks.tsx, not here. */

import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import {
  DragDropContext, Droppable, Draggable, DropResult,
} from 'react-beautiful-dnd';
import { Action } from './action';
import {
  State,
  EditorResponseLoop,
} from './state';
import { Chunk, getStartLineForIndex } from './chunk';
import { RHSObjects } from './rhsObject';
import DefChunk from './DefChunk';
import backendCmdFromState from './editor_loop';

type StateProps = {
  chunks: Chunk[],
  focusedChunk: number | undefined,
  rhs: RHSObjects,
  debugBorders: boolean,
  editorResponseLoop: EditorResponseLoop,
};

type DispatchProps = {
  handleReorder: any,
  setRHS: () => void,
};

function mapStateToProps(state: State): StateProps {
  const {
    chunks,
    focusedChunk,
    rhs,
    debugBorders,
    editorResponseLoop,
  } = state;

  return {
    chunks,
    focusedChunk,
    rhs,
    debugBorders,
    editorResponseLoop,
  };
}

function mapDispatchToProps(dispatch: (action: Action) => any): DispatchProps {
  return {
    /* Reorders chunks, making sure that all of their line numbers are correctly
       assigned. Also marks any reordered chunks as not linted.

       Arguments:
         result: DropResult obtained from react-beautiful-dnd drag context
         chunks: the chunks to be reordered
         oldFocusedId: the focused chunk */
    handleReorder(
      result: DropResult,
      chunks: Chunk[],
      oldFocusedId: string | false,
      editorResponseLoop: EditorResponseLoop,
    ) {
      // Great examples! https://codesandbox.io/s/k260nyxq9v
      const reorder = (innerChunks: Chunk[], start: number, end: number) => {
        const newResult = Array.from(innerChunks);
        const [removed] = newResult.splice(start, 1);
        newResult.splice(end, 0, removed);
        return newResult;
      };
      if (result.destination === undefined) { return; }

      const newChunks = reorder(chunks, result.source.index, result.destination.index);

      for (let i = 0; i < newChunks.length; i += 1) {
        newChunks[i].startLine = getStartLineForIndex(newChunks, i);
        if (result.source.index < result.destination.index) {
          if (i >= result.source.index && i <= result.destination.index) {
            newChunks[i].errorState.status = 'notLinted';
          }
        } else if (result.source.index > result.destination.index) {
          if (i >= result.destination.index && i <= result.source.index) {
            newChunks[i].errorState.status = 'notLinted';
          }
        }
      }

      function getNewFocusedChunk() {
        for (let i = 0; i < newChunks.length; i += 1) {
          if (newChunks[i].id === oldFocusedId) {
            return i;
          }
        }

        return false;
      }

      dispatch({
        type: 'update',
        key: 'chunks',
        value: {
          chunks: newChunks,
          modifiesText: true,
        },
      });

      if (oldFocusedId !== false) {
        const newFocusedChunk = getNewFocusedChunk();
        if (newFocusedChunk === false) {
          throw new Error('handleReorder: new focused chunk is false');
        }

        if (chunks[newFocusedChunk].id !== oldFocusedId) {
          dispatch({ type: 'update', key: 'focusedChunk', value: newFocusedChunk });
        } else {
          dispatch({ type: 'enqueueEffect', effect: { effectKey: 'initCmd', cmd: backendCmdFromState(editorResponseLoop) } });
        }
      } else {
        dispatch({ type: 'enqueueEffect', effect: { effectKey: 'initCmd', cmd: backendCmdFromState(editorResponseLoop) } });
      }
    },
    setRHS() {
      dispatch({ type: 'update', key: 'rhs', value: 'make-outdated' });
    },
  };
}

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;
type DefChunksProps = PropsFromRedux & DispatchProps & StateProps;

function DefChunks({
  handleReorder,
  chunks,
  focusedChunk,
  setRHS,
  debugBorders,
  editorResponseLoop,
}: DefChunksProps) {
  const onDragEnd = (result: DropResult) => {
    if (result.destination !== null
        && result.source!.index !== result.destination!.index) {
      if (focusedChunk === undefined) {
        handleReorder(result, chunks, false, editorResponseLoop);
        setRHS();
      } else {
        const fc = chunks[focusedChunk];
        if (fc === undefined) {
          throw new Error('onDragEnd: chunks[focusedChunk] is undefined');
        }
        handleReorder(result, chunks, fc.id);
        setRHS();
      }
    }
  };

  function setupChunk(chunk: Chunk, index: number) {
    const focused = focusedChunk === index;

    /* Returns the color of the drag handle */
    function getBorderColor() {
      if (focused && chunk.errorState.status === 'failed') {
        return 'red';
      }

      if (!focused && chunk.errorState.status === 'failed') {
        return '#ff9999';
      }

      if (debugBorders === true) {
        if (focused && chunk.errorState.status === 'notLinted') {
          return 'orange';
        }

        if (!focused && chunk.errorState.status === 'notLinted') {
          return 'yellow';
        }
      }

      if (focused) {
        return 'lightgray';
      }

      return '#eee';
    }

    const border = getBorderColor();

    return (
      <Draggable key={chunk.id} draggableId={chunk.id} index={index}>
        {(draggableProvided) => (
          <div
            ref={draggableProvided.innerRef}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...draggableProvided.draggableProps}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                width: '100%',
              }}
            >
              <div
              // eslint-disable-next-line react/jsx-props-no-spreading
                {...draggableProvided.dragHandleProps}
                style={{
                  minWidth: '1.5em',
                  height: 'auto',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderLeft: '1px solid lightgray',
                  background: `${border}`,
                  borderRadius: '75% 0% 0% 75%',
                  marginLeft: '0.5em',
                  userSelect: 'none',
                }}
              >
                ::
              </div>
              <DefChunk
                key={chunk.id}
                index={index}
                focused={focused}
              />
            </div>
          </div>
        )}
      </Draggable>
    );
  }

  const allChunks = chunks.map(setupChunk);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable">
        {(provided) => (
          <div
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {allChunks}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

export default connector(DefChunks);
