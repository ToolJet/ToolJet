import React from 'react';
import { Header } from '@/_components';

export const StorageLayer = ({ switchDarkMode, darkMode }) => {
  return (
    <div className="page-wrapper">
      <Header switchDarkMode={switchDarkMode} darkMode={darkMode} />
      {/* Page body */}
      <div className="page-body">
        <div className="container-xl">
          <div className="row g-4">
            <div className="col-3">
              <div className="subheader mb-2">Category</div>
              <div className="list-group list-group-transparent mb-3">
                <a className="list-group-item list-group-item-action d-flex align-items-center active" href="#">
                  Games
                  <small className="text-muted ms-auto">24</small>
                </a>
                <a className="list-group-item list-group-item-action d-flex align-items-center" href="#">
                  Clothing
                  <small className="text-muted ms-auto">149</small>
                </a>
                <a className="list-group-item list-group-item-action d-flex align-items-center" href="#">
                  Jewelery
                  <small className="text-muted ms-auto">88</small>
                </a>
                <a className="list-group-item list-group-item-action d-flex align-items-center" href="#">
                  Toys
                  <small className="text-muted ms-auto">54</small>
                </a>
              </div>
            </div>
            <div className="col-9">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Invoices</h3>
                </div>
                <div className="card-body border-bottom py-3">
                  <div className="d-flex">
                    <div className="text-muted">
                      Show
                      <div className="mx-2 d-inline-block">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          defaultValue={8}
                          size={3}
                          aria-label="Invoices count"
                        />
                      </div>
                      entries
                    </div>
                    <div className="ms-auto text-muted">
                      Search:
                      <div className="ms-2 d-inline-block">
                        <input type="text" className="form-control form-control-sm" aria-label="Search invoice" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table card-table table-vcenter text-nowrap datatable">
                    <thead>
                      <tr>
                        <th className="w-1">
                          <input
                            className="form-check-input m-0 align-middle"
                            type="checkbox"
                            aria-label="Select all invoices"
                          />
                        </th>
                        <th className="w-1">
                          No. {/* Download SVG icon from http://tabler-icons.io/i/chevron-up */}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="icon icon-sm text-dark icon-thick"
                            width={24}
                            height={24}
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <polyline points="6 15 12 9 18 15" />
                          </svg>
                        </th>
                        <th>Invoice Subject</th>
                        <th>Client</th>
                        <th>VAT No.</th>
                        <th>Created</th>
                        <th>Status</th>
                        <th>Price</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <input
                            className="form-check-input m-0 align-middle"
                            type="checkbox"
                            aria-label="Select invoice"
                          />
                        </td>
                        <td>
                          <span className="text-muted">001401</span>
                        </td>
                        <td>
                          <a href="invoice.html" className="text-reset" tabIndex={-1}>
                            Design Works
                          </a>
                        </td>
                        <td>
                          <span className="flag flag-country-us" />
                          Carlson Limited
                        </td>
                        <td>87956621</td>
                        <td>15 Dec 2017</td>
                        <td>
                          <span className="badge bg-success me-1" /> Paid
                        </td>
                        <td>$887</td>
                        <td className="text-end">
                          <span className="dropdown">
                            <button
                              className="btn dropdown-toggle align-text-top"
                              data-bs-boundary="viewport"
                              data-bs-toggle="dropdown"
                            >
                              Actions
                            </button>
                            <div className="dropdown-menu dropdown-menu-end">
                              <a className="dropdown-item" href="#">
                                Action
                              </a>
                              <a className="dropdown-item" href="#">
                                Another action
                              </a>
                            </div>
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <input
                            className="form-check-input m-0 align-middle"
                            type="checkbox"
                            aria-label="Select invoice"
                          />
                        </td>
                        <td>
                          <span className="text-muted">001402</span>
                        </td>
                        <td>
                          <a href="invoice.html" className="text-reset" tabIndex={-1}>
                            UX Wireframes
                          </a>
                        </td>
                        <td>
                          <span className="flag flag-country-gb" />
                          Adobe
                        </td>
                        <td>87956421</td>
                        <td>12 Apr 2017</td>
                        <td>
                          <span className="badge bg-warning me-1" /> Pending
                        </td>
                        <td>$1200</td>
                        <td className="text-end">
                          <span className="dropdown">
                            <button
                              className="btn dropdown-toggle align-text-top"
                              data-bs-boundary="viewport"
                              data-bs-toggle="dropdown"
                            >
                              Actions
                            </button>
                            <div className="dropdown-menu dropdown-menu-end">
                              <a className="dropdown-item" href="#">
                                Action
                              </a>
                              <a className="dropdown-item" href="#">
                                Another action
                              </a>
                            </div>
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <input
                            className="form-check-input m-0 align-middle"
                            type="checkbox"
                            aria-label="Select invoice"
                          />
                        </td>
                        <td>
                          <span className="text-muted">001403</span>
                        </td>
                        <td>
                          <a href="invoice.html" className="text-reset" tabIndex={-1}>
                            New Dashboard
                          </a>
                        </td>
                        <td>
                          <span className="flag flag-country-de" />
                          Bluewolf
                        </td>
                        <td>87952621</td>
                        <td>23 Oct 2017</td>
                        <td>
                          <span className="badge bg-warning me-1" /> Pending
                        </td>
                        <td>$534</td>
                        <td className="text-end">
                          <span className="dropdown">
                            <button
                              className="btn dropdown-toggle align-text-top"
                              data-bs-boundary="viewport"
                              data-bs-toggle="dropdown"
                            >
                              Actions
                            </button>
                            <div className="dropdown-menu dropdown-menu-end">
                              <a className="dropdown-item" href="#">
                                Action
                              </a>
                              <a className="dropdown-item" href="#">
                                Another action
                              </a>
                            </div>
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <input
                            className="form-check-input m-0 align-middle"
                            type="checkbox"
                            aria-label="Select invoice"
                          />
                        </td>
                        <td>
                          <span className="text-muted">001404</span>
                        </td>
                        <td>
                          <a href="invoice.html" className="text-reset" tabIndex={-1}>
                            Landing Page
                          </a>
                        </td>
                        <td>
                          <span className="flag flag-country-br" />
                          Salesforce
                        </td>
                        <td>87953421</td>
                        <td>2 Sep 2017</td>
                        <td>
                          <span className="badge bg-secondary me-1" /> Due in 2 Weeks
                        </td>
                        <td>$1500</td>
                        <td className="text-end">
                          <span className="dropdown">
                            <button
                              className="btn dropdown-toggle align-text-top"
                              data-bs-boundary="viewport"
                              data-bs-toggle="dropdown"
                            >
                              Actions
                            </button>
                            <div className="dropdown-menu dropdown-menu-end">
                              <a className="dropdown-item" href="#">
                                Action
                              </a>
                              <a className="dropdown-item" href="#">
                                Another action
                              </a>
                            </div>
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <input
                            className="form-check-input m-0 align-middle"
                            type="checkbox"
                            aria-label="Select invoice"
                          />
                        </td>
                        <td>
                          <span className="text-muted">001405</span>
                        </td>
                        <td>
                          <a href="invoice.html" className="text-reset" tabIndex={-1}>
                            Marketing Templates
                          </a>
                        </td>
                        <td>
                          <span className="flag flag-country-pl" />
                          Printic
                        </td>
                        <td>87956621</td>
                        <td>29 Jan 2018</td>
                        <td>
                          <span className="badge bg-danger me-1" /> Paid Today
                        </td>
                        <td>$648</td>
                        <td className="text-end">
                          <span className="dropdown">
                            <button
                              className="btn dropdown-toggle align-text-top"
                              data-bs-boundary="viewport"
                              data-bs-toggle="dropdown"
                            >
                              Actions
                            </button>
                            <div className="dropdown-menu dropdown-menu-end">
                              <a className="dropdown-item" href="#">
                                Action
                              </a>
                              <a className="dropdown-item" href="#">
                                Another action
                              </a>
                            </div>
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <input
                            className="form-check-input m-0 align-middle"
                            type="checkbox"
                            aria-label="Select invoice"
                          />
                        </td>
                        <td>
                          <span className="text-muted">001406</span>
                        </td>
                        <td>
                          <a href="invoice.html" className="text-reset" tabIndex={-1}>
                            Sales Presentation
                          </a>
                        </td>
                        <td>
                          <span className="flag flag-country-br" />
                          Tabdaq
                        </td>
                        <td>87956621</td>
                        <td>4 Feb 2018</td>
                        <td>
                          <span className="badge bg-secondary me-1" /> Due in 3 Weeks
                        </td>
                        <td>$300</td>
                        <td className="text-end">
                          <span className="dropdown">
                            <button
                              className="btn dropdown-toggle align-text-top"
                              data-bs-boundary="viewport"
                              data-bs-toggle="dropdown"
                            >
                              Actions
                            </button>
                            <div className="dropdown-menu dropdown-menu-end">
                              <a className="dropdown-item" href="#">
                                Action
                              </a>
                              <a className="dropdown-item" href="#">
                                Another action
                              </a>
                            </div>
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <input
                            className="form-check-input m-0 align-middle"
                            type="checkbox"
                            aria-label="Select invoice"
                          />
                        </td>
                        <td>
                          <span className="text-muted">001407</span>
                        </td>
                        <td>
                          <a href="invoice.html" className="text-reset" tabIndex={-1}>
                            Logo &amp; Print
                          </a>
                        </td>
                        <td>
                          <span className="flag flag-country-us" />
                          Apple
                        </td>
                        <td>87956621</td>
                        <td>22 Mar 2018</td>
                        <td>
                          <span className="badge bg-success me-1" /> Paid Today
                        </td>
                        <td>$2500</td>
                        <td className="text-end">
                          <span className="dropdown">
                            <button
                              className="btn dropdown-toggle align-text-top"
                              data-bs-boundary="viewport"
                              data-bs-toggle="dropdown"
                            >
                              Actions
                            </button>
                            <div className="dropdown-menu dropdown-menu-end">
                              <a className="dropdown-item" href="#">
                                Action
                              </a>
                              <a className="dropdown-item" href="#">
                                Another action
                              </a>
                            </div>
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <input
                            className="form-check-input m-0 align-middle"
                            type="checkbox"
                            aria-label="Select invoice"
                          />
                        </td>
                        <td>
                          <span className="text-muted">001408</span>
                        </td>
                        <td>
                          <a href="invoice.html" className="text-reset" tabIndex={-1}>
                            Icons
                          </a>
                        </td>
                        <td>
                          <span className="flag flag-country-pl" />
                          Tookapic
                        </td>
                        <td>87956621</td>
                        <td>13 May 2018</td>
                        <td>
                          <span className="badge bg-success me-1" /> Paid Today
                        </td>
                        <td>$940</td>
                        <td className="text-end">
                          <span className="dropdown">
                            <button
                              className="btn dropdown-toggle align-text-top"
                              data-bs-boundary="viewport"
                              data-bs-toggle="dropdown"
                            >
                              Actions
                            </button>
                            <div className="dropdown-menu dropdown-menu-end">
                              <a className="dropdown-item" href="#">
                                Action
                              </a>
                              <a className="dropdown-item" href="#">
                                Another action
                              </a>
                            </div>
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="card-footer d-flex align-items-center">
                  <p className="m-0 text-muted">
                    Showing <span>1</span> to <span>8</span> of <span>16</span> entries
                  </p>
                  <ul className="pagination m-0 ms-auto">
                    <li className="page-item disabled">
                      <a className="page-link" href="#" tabIndex={-1} aria-disabled="true">
                        {/* Download SVG icon from http://tabler-icons.io/i/chevron-left */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="icon"
                          width={24}
                          height={24}
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                          <polyline points="15 6 9 12 15 18" />
                        </svg>
                        prev
                      </a>
                    </li>
                    <li className="page-item">
                      <a className="page-link" href="#">
                        1
                      </a>
                    </li>
                    <li className="page-item active">
                      <a className="page-link" href="#">
                        2
                      </a>
                    </li>
                    <li className="page-item">
                      <a className="page-link" href="#">
                        3
                      </a>
                    </li>
                    <li className="page-item">
                      <a className="page-link" href="#">
                        4
                      </a>
                    </li>
                    <li className="page-item">
                      <a className="page-link" href="#">
                        5
                      </a>
                    </li>
                    <li className="page-item">
                      <a className="page-link" href="#">
                        next {/* Download SVG icon from http://tabler-icons.io/i/chevron-right */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="icon"
                          width={24}
                          height={24}
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                          <polyline points="9 6 15 12 9 18" />
                        </svg>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
