USE [CCBP]
GO
/****** Object:  StoredProcedure [ccbp].[sp_set_client_accounts]    Script Date: 07/17/2022 9:58:30 p. m. ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO




/****** Object:  StoredProcedure [ccbp].[sp_set_client_accounts]    Script Date: 06/05/2020 9:35:55 a. m. ******/
-- =============================================
-- Author:		Davis E. Arosemena
-- Create date: 30-septiembre-2019
-- Description:	Validar y actualizar password y token JWT.
--
-- Modificado por: Eric Serracín
-- Fecha Modifica: 22-Mayo-2020
--
--
-- Modificado por: Eric Serracín
-- Fecha Modifica: 10-Junio-2020
--
--
-- Modificado por: Eric Serracín
-- Fecha Modifica: 07-Abril-2021
-- =============================================
ALTER PROCEDURE [ccbp].[sp_set_client_accounts]
	@company int,
	@source varchar(50),
	@country int,
	@request_id varchar(150),
	@trace_id varchar(150),
	@ccbp_id varchar(50),
	@email varchar(255), 
	@password varchar(255),
	@question_id_1 nvarchar(255), --ESE. Correccion; cambio de int a nvarchar(255)
	@response_1 nvarchar(255), --ESE. Correccion cambio de varchar(50) a nvarchar(255)
	@question_id_2 nvarchar(255), --ESE. Correccion; cambio de int a nvarchar(255)
	@response_2 nvarchar(255), --ESE. Correccion cambio de varchar(50) a nvarchar(255)
	@question_id_3 nvarchar(255), --ESE. Correccion; cambio de int a nvarchar(255)
	@response_3 nvarchar(255), --ESE. Correccion cambio de varchar(50) a nvarchar(255)
	@app_load varchar(255), 
	@jwt_session varchar(4000),
	@jwt_invitation varchar(4000),
	@type varchar(5) 
	
	--VC: Verificar Credenciales -> parámetros: client_id o email/Pass, 
	--VT: Verificar Token		  -> parámetros: ccbp_id/jwt_session, 
	--VTI: Verificar Token Invitación -> parámetros: ccbp_id/jwt_invitation,
	--VR: Verificar Respuesta pregunta -> parámetros: ccbp_id/question_id_1/response_1
	--UT: Actualización Token    -> parámetros: ccbp_id/jwt_session,
	--UTI: Actualización Token Invitación -> parámetros: ccbp_id/jwt_invitation,
	--UPI: Actualización Password y Respuestas de preguntas -> parámetros: ccbp_id/Pass/jwt_invitation
				--question_id_1...3/response_1...3.
	--GU: Obtener usuario -> parámetros: email
AS
BEGIN TRY
	SET NOCOUNT ON;
	DECLARE @inputs varchar(1000) = convert(varchar,isnull(@ccbp_id,''))+'|'+
		convert(varchar,isnull(@email,''))+'|'+convert(varchar,isnull(@app_load,''))+'|'+convert(varchar,@type)+'|'+convert(varchar,@jwt_session)
	
	DECLARE @counterClient int
	IF (@type = 'VC')
	BEGIN

		--ESE:2020-05-22 Agregando la opcion del rol tipo securityAccount, backoffice, mainAccount y secundaryAccount
		--=========================================================================================
		if exists (	select	ccbp_id 
					from	[ccbp].[client_accounts] cl 
					where	email = @email 
							and cl.enabled = 1
							and cl.external_adm = 0 
							and cl.back_office = 0
							and cl.parent_id is null)
		begin
			select	cl.ccbp_id
					,email
					,email as username
					,'' [name]
					,'' last_name
					,'["securityAccount"]' roles
					,question_id_1
					,question_id_2
					,question_id_3 
			from	[ccbp].[client_accounts] cl 
			where	email = @email
					and password = @password 
					and cl.enabled = 1 
		end
		else if exists (select ccbp_id from [ccbp].[client_accounts] cl where email = @email and cl.enabled = 1 and cl.back_office = 1)
		begin
			select	cl.ccbp_id
					,email
					,email as username
					,'' [name]
					,'' last_name
					,'["backOffice"]' roles
					,question_id_1
					,question_id_2
					,question_id_3 
			from	[ccbp].[client_accounts] cl 
			where	email = @email
					and password = @password 
					and cl.enabled = 1 
		end
		else
		begin
			select	cl.ccbp_id
					,email
					,email as username
					,(	select	CASE WHEN PRIMER_NOMBRE IS NOT NULL THEN PRIMER_NOMBRE ELSE NOMBRE_COMPLETO END 
						FROM	CCB3BX40C.DM_CCB.dbo.DM_CLIENTES 
						WHERE	CLIENTE_ID collate  Modern_Spanish_CI_AS = rel.client_id) as name
					,(	select	PRIMER_APELLIDO+' '+SEGUNDO_APELLIDO 
						FROM	CCB3BX40C.DM_CCB.dbo.DM_CLIENTES 
						WHERE	CLIENTE_ID collate  Modern_Spanish_CI_AS  = rel.client_id) as last_name
					,'["EcommerceUser"]' as roles
					,question_id_1
					,question_id_2
					,question_id_3 
			from	[ccbp].[client_accounts] cl 
					inner join [Ecommerce_dev].portal.[accounts_x_ecommerce] rel  
						on cl.ccbp_id = rel.ccbp_id 
			where	email = @email
					and password = @password 
					and cl.enabled = 1 
					and rel.enabled = 1
		end
	END
	ELSE IF(@type = 'JWT')
	BEGIN
		select	ccbp_id
				,ca.email
				,ca.email as username
				,a.firstName as name
				,a.lastName
				,'["EcommerceUser"]' as roles
				,question_id_1
				,question_id_2
				,question_id_3 
		from	ccbp.client_accounts ca
				inner join ccbp.accounts a on ca.ccbp_id = a.account_id
		where	ca.ccbp_id = @ccbp_id	
	END
	ELSE
	BEGIN
		--ESE:2020-05-22 Agregando la opcion del rol tipo securityAccount, backoffice, mainAccount y secundaryAccount
		--=========================================================================================
		if exists (	select	ccbp_id 
					from	[ccbp].[client_accounts] cl 
					where	email = @email 
							and cl.enabled = 1
							and cl.external_adm = 0 
							and cl.back_office = 0
							and cl.parent_id is null)
		begin
			select	cl.ccbp_id
					,email
					,email as username
					,'' [name]
					,'' last_name
					,'securityAccount' roles
					,question_id_1
					,question_id_2
					,question_id_3 
			from	[ccbp].[client_accounts] cl 
			where	email = @email
					and cl.enabled = 1 
		end
		else if exists (select ccbp_id from [ccbp].[client_accounts] cl where email = @email and cl.enabled = 1 and cl.back_office = 1)
		begin
			select	cl.ccbp_id
					,email
					,email as username
					,'' [name]
					,'' last_name
					,'backOffice' roles
					,cl.question_id_1
					,question_id_2
					,question_id_3
					,cl.back_office
			from	[ccbp].[client_accounts] cl 
			where	email = @email
					and cl.enabled = 1 
		end
		else
		begin
			select	cl.ccbp_id
					,email
					,email as username
					,(	select	CASE WHEN PRIMER_NOMBRE IS NOT NULL THEN PRIMER_NOMBRE ELSE NOMBRE_COMPLETO END 
						FROM	CCB3BX40C.DM_CCB.dbo.DM_CLIENTES 
						WHERE	CLIENTE_ID collate  Modern_Spanish_CI_AS = rel.client_id) as name
					,(	select	PRIMER_APELLIDO+' '+SEGUNDO_APELLIDO 
						FROM	CCB3BX40C.DM_CCB.dbo.DM_CLIENTES 
						WHERE	CLIENTE_ID collate  Modern_Spanish_CI_AS  = rel.client_id) as last_name
					,CASE	WHEN cl.external_adm = 1 THEN 'mainAccount' 
							ELSE 'secundaryAccount' END as roles
					,question_id_1
					,question_id_2
					,question_id_3 
			from	[ccbp].[client_accounts] cl 
					inner join [Ecommerce_dev].portal.[accounts_x_ecommerce] rel 
						on cl.ccbp_id = rel.ccbp_id 
			where	email = @email
					and cl.enabled = 1 
					and rel.enabled = 1
		end
		--ESE:2020-05-22 Agregando la opcion del rol tipo backoffice, mainAccount y secundaryAccount
	END

	set @counterClient = @@ROWCOUNT

	BEGIN TRANSACTION;
		IF (@type = 'VC') --Verificar Credenciales -> parámetros: User/Pass
			BEGIN
				--TODO: validar y búscar por App basado en el parámetro app_load.
				if(@counterClient > 0)
					select 'true' as success, 'Credenciales correctas.' as message
				else
					select 'false' as success, 'Credenciales incorrectas.' as message
			END
		ELSE IF (@type = 'VT') --Verificar Token -> parámetros: ccbp_id/jwt_session
			BEGIN
				select @counterClient = count(*) from [ccbp].[client_accounts] 
					where ccbp_id = convert(uniqueidentifier,@ccbp_id) and jwt_session = @jwt_session and enabled = 1

				if(@counterClient > 0)
					select 'true' as success, 'Token válido.' as message
				else
					select 'false' as success, 'Token inválido o cuenta no habilitada.' as message
			END
		ELSE IF (@type = 'VTI') --Verificar Token Invitación -> parámetros: ccbp_id/jwt_invitation
			BEGIN
				select @counterClient = count(*) from [ccbp].[client_accounts] 
					where ccbp_id = @ccbp_id and jwt_invitation = @jwt_invitation

				if(@counterClient > 0)
					select 'true' as success, 'Token válido.' as message
				else
					select 'false' as success, 'Token inválido o cuenta no habilitada.' as message
			END
		ELSE IF (@type = 'VR') --Verificar Respuesta pregunta -> parámetros: ccbp_id/question_id_1/response_1
			BEGIN
				select @counterClient = count(*) from [ccbp].[client_accounts] 
					where ccbp_id = @ccbp_id and enabled = 1 and 
					((question_id_1 = @question_id_1 and response_1 = @response_1) or
					(question_id_2 = @question_id_1 and response_2 = @response_1) or 
					(question_id_3 = @question_id_1 and response_3 = @response_1))

				if(@counterClient > 0)
					select 'true' as success, 'Respuesta de pregunta de seguridad válida.' as message
				else
					select 'false' as success, 'Respuesta de pregunta de seguridad inválido o cuenta no habilitada.' as message
			END
		ELSE IF (@type = 'UT') --Actualización Token -> parámetros: ccbp_id/jwt_session
			BEGIN
				UPDATE [ccbp].[client_accounts] SET jwt_session = @jwt_session, update_date = GETDATE()
					where ccbp_id = @ccbp_id

				if(@@ROWCOUNT > 0)
					select 'true' as success, 'Se ha actualizado el token.' as message
				else
					select 'false' as success, 'No se ha actualizado el token. Cuenta no existe.' as message
			END
		ELSE IF (@type = 'UTI') --Actualización Token Invitación -> parámetros: ccbp_id/jwt_invitation.
			BEGIN
				UPDATE	[ccbp].[client_accounts] 
				SET		jwt_invitation = @jwt_invitation, 
						password = null,
						question_id_1 = null,
						response_1 = null,
						question_id_2 = null,
						response_2 = null,
						question_id_3 = null,
						response_3 = null,
						update_date = GETDATE()
				where	ccbp_id = @ccbp_id
					
				if(@@ROWCOUNT > 0)
					select 'true' as success, 'Se ha actualizado el token.' as message
				else
					select 'false' as success, 'No se ha actualizado el token. Cuenta no existe.' as message
			END
		ELSE IF (@type = 'UPI') --Actualización Password por Invitación -> parámetros: ccbp_id/Pass
			BEGIN
				UPDATE [ccbp].[client_accounts] SET password = @password, question_id_1 = @question_id_1, 
					response_1 = @response_1, question_id_2 = @question_id_2, response_2 = @response_2, 
					question_id_3 = @question_id_3, response_3 = @response_3, jwt_invitation = 'usuario_invitado', enabled = 1,
					update_date = GETDATE() where ccbp_id = @ccbp_id and jwt_invitation = @jwt_invitation

				if(@@ROWCOUNT > 0)
					BEGIN
						--UPDATE [ccbp].[client_accounts_rel] SET enabled = 1, update_date = GETDATE()
						--	where ccbp_id = convert(uniqueidentifier,@ccbp_id)
						select 'true' as success, 'Se ha actualizado el password.' as message
					END
				else
					select 'false' as success, 'No se ha actualizado el password. Cuenta o token no existe.' as message
			END
		ELSE IF (@type = 'GU') --Obtener usuario -> parámetros: email.
			BEGIN
				if(@counterClient > 0)
					select 'true' as success, 'Se ha recuparado la cuenta.' as message
				else
					select 'false' as success, 'Cuenta no existe.' as message
			END

		-----------LOGS
		EXECUTE ccbp.sp_set_services_logs @request_id,@trace_id,@source,'ccbp.sp_set_client_accounts',null,null,null,
			@inputs,'client_accounts,client_accounts_rel,dm_clientes','SP',null,'SP',null
	COMMIT;	
END TRY
BEGIN CATCH   
	ROLLBACK;
	DECLARE @errorMsg varchar(4000)
	set @errorMsg = ERROR_MESSAGE()
	RAISERROR (@errorMsg,18,-1)
	select 'false' as success, @errorMsg as message

	EXECUTE ccbp.sp_set_services_logs @request_id,@trace_id,@source,'ccbp.sp_set_client_accounts',null,null,null,
			@inputs,'client_accounts','SP',@errorMsg,'SP',null
END CATCH;
