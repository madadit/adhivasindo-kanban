import { useState } from 'react';
import { IonApp, IonContent, IonPage, IonToast, setupIonicReact } from '@ionic/react';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import { KanbanBoard } from './pages/KanbanBoard';
import { TaskDetailModal } from './components/TaskDetailModal';
import { TaskItem } from './types/kanban';
import { useBoardStore } from './store/useBoardStore';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

export const App: React.FC = () => {
  const columns = useBoardStore((state) => state.columns);
  const tasks = useBoardStore((state) => state.tasks);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultColumnId, setDefaultColumnId] = useState<string>('col-todo');

  const [toastMessage, setToastMessage] = useState<string>('');
  const [isToastOpen, setIsToastOpen] = useState(false);

  const activeTask: TaskItem | null = selectedTaskId
    ? tasks.find((t) => t.id === selectedTaskId) ?? null
    : null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setIsToastOpen(true);
  };

  const handleOpenNewTask = (colId: string) => {
    setSelectedTaskId(null);
    setDefaultColumnId(colId || columns[0]?.id || 'col-todo');
    setIsModalOpen(true);
  };

  const handleSelectTask = (task: TaskItem) => {
    setSelectedTaskId(task.id);
    setDefaultColumnId(task.columnId);
    setIsModalOpen(true);
  };

  return (
    <IonApp>
      <IonPage>
        <IonContent fullscreen>
          <KanbanBoard
            onOpenNewTask={handleOpenNewTask}
            onSelectTask={handleSelectTask}
            onShowToast={showToast}
          />

          <TaskDetailModal
            isOpen={isModalOpen}
            task={activeTask}
            defaultColumnId={defaultColumnId}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedTaskId(null);
            }}
            onShowToast={showToast}
          />

          <IonToast
            isOpen={isToastOpen}
            message={toastMessage}
            duration={2000}
            position="bottom"
            onDidDismiss={() => setIsToastOpen(false)}
          />
        </IonContent>
      </IonPage>
    </IonApp>
  );
};

export default App;
