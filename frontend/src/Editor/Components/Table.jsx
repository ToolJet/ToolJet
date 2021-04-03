import React from 'react';

export const Table = function Table({ id, component, onComponentClick }) {
    
    const text = component.definition.properties.text.value;
    const backgroundColor = component.definition.styles.backgroundColor.value;
    const color = component.definition.styles.textColor.value;

    const computedStyles = { 
        backgroundColor,
        color
    }

    return (
        <div class="table-responsive table-bordered" style={{...computedStyles, width: '700px'}} onClick={() => onComponentClick(id, component) }>
            <table
                    class="table table-vcenter table-nowrap">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Title</th>
                    <th>Email</th>
                    <th>Role</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td >Paweł Kuna</td>
                    <td class="text-muted" >
                    UI Designer, Training
                    </td>
                    <td class="text-muted" ><a href="#" class="text-reset">paweluna@howstuffworks.com</a></td>
                    <td class="text-muted" >
                    User
                    </td>
                </tr>
                <tr>
                    <td >Jeffie Lewzey</td>
                    <td class="text-muted" >
                    Chemical Engineer, Support
                    </td>
                    <td class="text-muted" ><a href="#" class="text-reset">jlewzey1@seesaa.net</a></td>
                    <td class="text-muted" >
                    Admin
                    </td>
                </tr>
                <tr>
                    <td >Mallory Hulme</td>
                    <td class="text-muted" >
                    Geologist IV, Support
                    </td>
                    <td class="text-muted" ><a href="#" class="text-reset">mhulme2@domainmarket.com</a></td>
                    <td class="text-muted" >
                    User
                    </td>
                </tr>
                <tr>
                    <td >Dunn Slane</td>
                    <td class="text-muted" >
                    Research Nurse, Sales
                    </td>
                    <td class="text-muted" ><a href="#" class="text-reset">dslane3@epa.gov</a></td>
                    <td class="text-muted" >
                    Owner
                    </td>
                </tr>
                <tr>
                    <td >Emmy Levet</td>
                    <td class="text-muted" >
                    VP Product Management, Accounting
                    </td>
                    <td class="text-muted" ><a href="#" class="text-reset">elevet4@senate.gov</a></td>
                    <td class="text-muted" >
                    Admin
                    </td>
                </tr>
                </tbody>
                <div className="table-footer p-2">
                    Records 1-10 of 242
                </div>
            </table>
        </div>
    );
};
