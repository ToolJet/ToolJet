# Deploying ToolJet on Alibaba Cloud ComputeNest

<h1>ToolJet Community Edition Rapid Deployment </h1>

<h2> Prerequisites </h2>

<p> To deploy ToolJet community edition service instances, you need to access and create some Alibaba Cloud resources. Therefore, your account must contain permissions for the following resources.
<strong> Note </strong>: This permission is required only when your account is a RAM account. </p>

<table>
<thead>
<tr>
<th> Permission policy name </th>
<th> Remarks </th>
</tr>
</thead>
<tbody>
<tr>
<td>AliyunECSFullAccess</td>
<td> Permissions to manage ECS </td>
</tr>
<tr>
<td>AliyunVPCFullAccess</td>
<td> Permissions for managing VPC networks </td>
</tr>
<tr>
<td>AliyunROSFullAccess</td>
<td> Manage permissions for Resource Orchestration Services (ROS) </td>
</tr>
<tr>
<td>AliyunComputeNestUserFullAccess</td>
<td> Manage user-side permissions for the compute nest service (ComputeNest) </td>
</tr>
</tbody>
</table>

<h2> Billing instructions </h2>

<p> the cost of ToolJet community edition deployment in computing nest mainly involves:</p>

<ul>
<li> Selected vCPU and Memory Specifications </li>
<li> System disk type and capacity </li>
<li> Internet bandwidth </li>
</ul>

<h2> Deployment process </h2>

<ol>
<li><p> Visit the computing nest ToolJet community version <a href = "https://computenest.console.aliyun.com/service/instance/create/default?type=user&ServiceName=ToolJet社区版"> deployment link </a> and fill in the deployment parameters as prompted:
<li><p> after the parameters are filled in, you can see the corresponding inquiry details. after confirming the parameters, click <strong> next: confirm the order </strong>. </p></li>
<li><p> Confirm that the order is complete and agree to the service agreement and click <strong> Create Now </strong> to enter the deployment phase. </p></li>
<li><p> After the deployment is completed, you can start using the service. Enter the service instance details and click the ToolJet Server Address.
  <img src="/img/setup/alibabacloud/computenest-1.jpg" alt="ComputeNest Setup" />
<li><p> The ToolJet service can be used after loading.
  <img src="/img/setup/alibabacloud/computenest-2.jpg" alt="ComputeNest Setup" />
</p></li>
</ol>
