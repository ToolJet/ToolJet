import React, { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { useLicenseStore } from '@/_stores/licenseStore';
import { WorkspaceGitSyncModal } from '@/_ui/WorkspaceGitSyncModal';

export function WorkspaceGitCTA() {
  const [showModal, setShowModal] = useState(false);
  const [initialTab, setInitialTab] = useState('push');  
  const { currentBranch, orgGitConfig } = useWorkspaceBranchesStore((state) => ({
    currentBranch: state.currentBranch,
    orgGitConfig: state.orgGitConfig,
  }));

  const featureAccess = useLicenseStore((state) => state.featureAccess);

  if (!featureAccess?.gitSync || !orgGitConfig) return null;

  const defaultGitBranch = orgGitConfig?.default_git_branch || orgGitConfig?.defaultGitBranch || 'main';
  const isOnDefaultBranch =
    currentBranch?.is_default || currentBranch?.isDefault || currentBranch?.name === defaultGitBranch;
  const openModal = (tab) => {                                                                                                                                                             
      setInitialTab(tab);                                                                                                                                                                           
      setShowModal(true);                                                                                                                                                                           
      };                                                                                                                                                                                              
       
  return (
    <>
      <div className="lifecycle-cta-button">
        {/* <Button variant="secondary" onClick={() => setShowModal(true)}>
          <SolidIcon fill="var(--icon-accent)" viewBox="0 0 16 16" name="commit" width="16" />
          <span>{isOnDefaultBranch ? 'Pull commit ' : 'Commit'}</span>
        </Button> */}
        <Button variant="secondary" onClick={() => openModal('pull')}>                                                                                                                            
        <SolidIcon fill="var(--icon-accent)" viewBox="0 0 16 16" name="pull-changes" width="16" />                                                                                              
        <span>Pull</span>   
        </Button>
      </div>

      {/* {showModal && <WorkspaceGitSyncModal isOnDefaultBranch={isOnDefaultBranch} onClose={() => setShowModal(false)} />} */}
          {!isOnDefaultBranch && (                                                                                                                                                                    
            <div className="lifecycle-cta-button">                                                                                                                                                    
             <Button variant="secondary" onClick={() => openModal('push')}>                                                                                                                          
             <SolidIcon fill="var(--icon-accent)" viewBox="0 0 16 16" name="commit" width="16" />                                                                                                  
                <span>Commit</span>                                                                                                                                                                   
               </Button>                                                                                                                                                                               
             </div>                                                                                                                                                                                    
           )}                                                                                                                                                                                                                                                                                                                                                                                   
         {showModal && (                                                                                                                                                                             
          <WorkspaceGitSyncModal                                                                                                                                                                    
               isOnDefaultBranch={isOnDefaultBranch}                                                                                                                                                   
            initialTab={initialTab}                                                                                                                                                                 
           onClose={() => setShowModal(false)}                                                                                                                                                     
          />                                                                                                                                                                                        
        )}  
    </>
  );
}

export default WorkspaceGitCTA;
